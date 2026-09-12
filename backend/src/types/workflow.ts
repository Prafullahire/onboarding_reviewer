import type {
  AgentExecutionTrace,
  AutonomyMode,
  RecommendationDecision,
  RecommendationOutput,
} from './agent.js';

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'awaiting_human_approval'
  | 'awaiting_exception_review'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type HumanDecision = 'approve' | 'reject' | 'refer_manual_review' | 'override';

export interface ReviewWorkflow {
  id: string;
  caseId: string;
  autonomyMode: AutonomyMode;
  status: WorkflowStatus;
  traces: AgentExecutionTrace[];
  recommendation?: RecommendationOutput;
  finalDecision?: RecommendationDecision;
  humanDecision?: HumanDecision;
  humanDecisionNotes?: string;
  humanDecisionAt?: Date;
  requiresHumanAction: boolean;
  exceptionReason?: string;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StartReviewRequest {
  caseId: string;
  autonomyMode: AutonomyMode;
}

export interface HumanApprovalRequest {
  decision: HumanDecision;
  notes?: string;
}

export interface WorkflowTerminationResult {
  status: WorkflowStatus;
  finalDecision?: RecommendationDecision;
  requiresHumanAction: boolean;
  exceptionReason?: string;
}
