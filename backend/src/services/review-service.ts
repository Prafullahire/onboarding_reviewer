import { v4 as uuidv4 } from 'uuid';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getPool } from '../db/connection.js';
import { WorkflowOrchestrator } from '../orchestrator/workflow-orchestrator.js';
import { AuditService } from './audit-service.js';
import { CaseService } from './case-service.js';
import type {
  AgentExecutionTrace,
  AutonomyMode,
  RecommendationOutput,
} from '../types/agent.js';
import type {
  HumanApprovalRequest,
  ReviewWorkflow,
  WorkflowStatus,
} from '../types/workflow.js';

interface WorkflowRow extends RowDataPacket {
  id: string;
  case_id: string;
  autonomy_mode: AutonomyMode;
  status: WorkflowStatus;
  traces: string | AgentExecutionTrace[];
  recommendation: string | RecommendationOutput | null;
  final_decision: string | null;
  human_decision: string | null;
  human_decision_notes: string | null;
  human_decision_at: Date | null;
  requires_human_action: boolean;
  exception_reason: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function mapWorkflowRow(row: WorkflowRow): ReviewWorkflow {
  return {
    id: row.id,
    caseId: row.case_id,
    autonomyMode: row.autonomy_mode,
    status: row.status,
    traces:
      typeof row.traces === 'string'
        ? (JSON.parse(row.traces) as AgentExecutionTrace[])
        : row.traces,
    recommendation: row.recommendation
      ? typeof row.recommendation === 'string'
        ? (JSON.parse(row.recommendation) as RecommendationOutput)
        : row.recommendation
      : undefined,
    finalDecision: row.final_decision as ReviewWorkflow['finalDecision'],
    humanDecision: row.human_decision as ReviewWorkflow['humanDecision'],
    humanDecisionNotes: row.human_decision_notes ?? undefined,
    humanDecisionAt: row.human_decision_at ?? undefined,
    requiresHumanAction: Boolean(row.requires_human_action),
    exceptionReason: row.exception_reason ?? undefined,
    startedAt: row.started_at ?? row.created_at,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ReviewService {
  private readonly caseService = new CaseService();
  private readonly auditService = new AuditService();
  private readonly orchestrator = new WorkflowOrchestrator();

  async startReview(caseId: string, autonomyMode: AutonomyMode): Promise<ReviewWorkflow> {
    const caseRecord = await this.caseService.getById(caseId);
    if (!caseRecord) {
      throw new Error(`Case not found: ${caseId}`);
    }

    const workflowId = uuidv4();
    const pool = getPool();

    await pool.execute<ResultSetHeader>(
      `INSERT INTO review_workflows (id, case_id, autonomy_mode, status, traces, started_at)
       VALUES (:id, :caseId, :autonomyMode, 'running', :traces, NOW())`,
      {
        id: workflowId,
        caseId,
        autonomyMode,
        traces: JSON.stringify([]),
      }
    );

    await this.auditService.log({
      workflowId,
      caseId,
      eventType: 'workflow_started',
      eventData: { autonomyMode },
    });

    const result = await this.orchestrator.run(caseId, caseRecord.caseData, autonomyMode);

    await pool.execute(
      `UPDATE review_workflows SET
        status = :status,
        traces = :traces,
        recommendation = :recommendation,
        final_decision = :finalDecision,
        requires_human_action = :requiresHumanAction,
        exception_reason = :exceptionReason,
        completed_at = :completedAt
       WHERE id = :id`,
      {
        id: workflowId,
        status: result.termination.status,
        traces: JSON.stringify(result.traces),
        recommendation: result.recommendation ? JSON.stringify(result.recommendation) : null,
        finalDecision: result.termination.finalDecision ?? null,
        requiresHumanAction: result.termination.requiresHumanAction,
        exceptionReason: result.termination.exceptionReason ?? null,
        completedAt:
          result.termination.status === 'completed' ? new Date() : null,
      }
    );

    await this.auditService.log({
      workflowId,
      caseId,
      eventType: 'workflow_completed',
      eventData: {
        status: result.termination.status,
        recommendation: result.recommendation?.decision,
        finalDecision: result.termination.finalDecision,
      },
    });

    const workflow = await this.getById(workflowId);
    if (!workflow) throw new Error('Failed to retrieve workflow');
    return workflow;
  }

  async getById(id: string): Promise<ReviewWorkflow | null> {
    const pool = getPool();
    const [rows] = await pool.execute<WorkflowRow[]>(
      'SELECT * FROM review_workflows WHERE id = :id',
      { id }
    );
    return rows.length > 0 ? mapWorkflowRow(rows[0]) : null;
  }

  async listByCase(caseId: string): Promise<ReviewWorkflow[]> {
    const pool = getPool();
    const [rows] = await pool.execute<WorkflowRow[]>(
      'SELECT * FROM review_workflows WHERE case_id = :caseId ORDER BY created_at DESC',
      { caseId }
    );
    return rows.map(mapWorkflowRow);
  }

  async submitHumanDecision(
    workflowId: string,
    request: HumanApprovalRequest
  ): Promise<ReviewWorkflow> {
    const workflow = await this.getById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (
      workflow.status !== 'awaiting_human_approval' &&
      workflow.status !== 'awaiting_exception_review'
    ) {
      throw new Error(`Workflow is not awaiting human action. Current status: ${workflow.status}`);
    }

    let finalDecision = workflow.recommendation?.decision;

    if (request.decision === 'override' && workflow.recommendation) {
      finalDecision = workflow.recommendation.decision;
    } else if (request.decision !== 'override') {
      finalDecision = request.decision;
    }

    const pool = getPool();
    await pool.execute(
      `UPDATE review_workflows SET
        status = 'completed',
        human_decision = :humanDecision,
        human_decision_notes = :notes,
        human_decision_at = NOW(),
        final_decision = :finalDecision,
        requires_human_action = FALSE,
        completed_at = NOW()
       WHERE id = :id`,
      {
        id: workflowId,
        humanDecision: request.decision,
        notes: request.notes ?? null,
        finalDecision,
      }
    );

    await this.auditService.log({
      workflowId,
      caseId: workflow.caseId,
      eventType: 'human_decision_submitted',
      eventData: {
        decision: request.decision,
        finalDecision,
        notes: request.notes,
      },
    });

    const updated = await this.getById(workflowId);
    if (!updated) throw new Error('Failed to retrieve updated workflow');
    return updated;
  }

  async getAuditLog(workflowId: string) {
    return this.auditService.getByWorkflow(workflowId);
  }
}
