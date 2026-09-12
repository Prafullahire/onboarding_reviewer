import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { createAgents } from '../agents/index.js';
import type {
  Agent,
  AgentContext,
  AgentExecutionTrace,
  AgentName,
  AgentOutput,
  AutonomyMode,
  RecommendationDecision,
  RecommendationOutput,
} from '../types/agent.js';
import type { OnboardingCaseData } from '../types/onboarding-case.js';
import type { WorkflowTerminationResult } from '../types/workflow.js';

const ANALYSIS_AGENTS: AgentName[] = [
  'document_completeness',
  'identity_consistency',
  'risk_indicator',
];

const ALL_AGENTS: AgentName[] = [...ANALYSIS_AGENTS, 'recommendation'];

export interface OrchestratorRunResult {
  traces: AgentExecutionTrace[];
  recommendation?: RecommendationOutput;
  termination: WorkflowTerminationResult;
}

export class WorkflowOrchestrator {
  private readonly agents: Map<AgentName, Agent>;
  private readonly maxRetries: number;

  constructor(maxRetries = config.agent.maxRetries) {
    this.agents = createAgents();
    this.maxRetries = maxRetries;
  }

  async run(
    caseId: string,
    caseData: OnboardingCaseData,
    autonomyMode: AutonomyMode,
    onTraceUpdate?: (traces: AgentExecutionTrace[]) => void
  ): Promise<OrchestratorRunResult> {
    const traces: AgentExecutionTrace[] = [];
    const priorOutputs: AgentContext['priorOutputs'] = {};

    for (const agentName of ALL_AGENTS) {
      const trace = await this.executeAgentWithRetry(
        agentName,
        { caseId, caseData, priorOutputs },
        traces
      );
      traces.push(trace);
      onTraceUpdate?.(traces);

      if (trace.status === 'failed') {
        return {
          traces,
          termination: {
            status: 'failed',
            requiresHumanAction: true,
            exceptionReason: `Agent ${agentName} failed after ${this.maxRetries + 1} attempts: ${trace.error}`,
          },
        };
      }

      if (trace.output) {
        this.storePriorOutput(agentName, trace.output, priorOutputs);
      }

      if (agentName !== 'recommendation' && this.shouldHaltEarly(agentName, trace.output)) {
        const recommendation = this.buildEarlyRecommendation(agentName, trace.output!, priorOutputs);
        traces.push(this.createSkippedTraces('recommendation'));
        return {
          traces,
          recommendation,
          termination: this.determineTermination(recommendation, autonomyMode, true),
        };
      }
    }

    const recommendationTrace = traces.find(
      (t) => t.agentName === 'recommendation' && t.status === 'completed'
    );
    const recommendation = recommendationTrace?.output as RecommendationOutput | undefined;
    if (!recommendation) {
      return {
        traces,
        termination: {
          status: 'failed',
          requiresHumanAction: true,
          exceptionReason: 'Recommendation agent did not produce output.',
        },
      };
    }

    return {
      traces,
      recommendation,
      termination: this.determineTermination(recommendation, autonomyMode, false),
    };
  }

  private async executeAgentWithRetry(
    agentName: AgentName,
    context: AgentContext,
    existingTraces: AgentExecutionTrace[]
  ): Promise<AgentExecutionTrace> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      return {
        id: uuidv4(),
        agentName,
        status: 'failed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        inputSummary: this.buildInputSummary(agentName, context),
        error: `Agent ${agentName} not registered.`,
        retryCount: 0,
      };
    }

    let lastError: string | undefined;
    let retryCount = 0;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const startedAt = new Date();
      const trace: AgentExecutionTrace = {
        id: uuidv4(),
        agentName,
        status: 'running',
        startedAt: startedAt.toISOString(),
        inputSummary: this.buildInputSummary(agentName, context),
        retryCount,
      };

      try {
        const result = await this.withTimeout(agent.execute(context), config.agent.timeoutMs);
        const completedAt = new Date();

        if (result.success && result.output) {
          return {
            ...trace,
            status: 'completed',
            completedAt: completedAt.toISOString(),
            durationMs: completedAt.getTime() - startedAt.getTime(),
            output: result.output,
            retryCount,
          };
        }

        lastError = result.error ?? 'Agent returned unsuccessful result.';
        retryCount++;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Agent execution timed out or failed.';
        retryCount++;
      }
    }

    return {
      id: uuidv4(),
      agentName,
      status: 'failed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      inputSummary: this.buildInputSummary(agentName, context),
      error: lastError,
      retryCount,
    };
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Agent timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  private buildInputSummary(agentName: AgentName, context: AgentContext): string {
    const customer = context.caseData.customerProfile.fullName;
    switch (agentName) {
      case 'document_completeness':
        return `Analyzing ${context.caseData.supportingDocuments.length} documents for ${customer}`;
      case 'identity_consistency':
        return `Cross-validating identity for ${customer} (${context.caseData.identityDetails.idType})`;
      case 'risk_indicator':
        return `Assessing risk indicators for ${customer}`;
      case 'recommendation':
        return `Synthesizing specialist agent outputs for ${customer}`;
      default:
        return `Processing ${customer}`;
    }
  }

  private storePriorOutput(
    agentName: AgentName,
    output: AgentOutput,
    priorOutputs: AgentContext['priorOutputs']
  ): void {
    if (agentName === 'document_completeness') {
      priorOutputs.document_completeness = output as AgentContext['priorOutputs']['document_completeness'];
    } else if (agentName === 'identity_consistency') {
      priorOutputs.identity_consistency = output as AgentContext['priorOutputs']['identity_consistency'];
    } else if (agentName === 'risk_indicator') {
      priorOutputs.risk_indicator = output as AgentContext['priorOutputs']['risk_indicator'];
    }
  }

  private shouldHaltEarly(agentName: AgentName, output?: AgentOutput): boolean {
    return false;
  }

  private buildEarlyRecommendation(
    _failedAgent: AgentName,
    _output: AgentOutput,
    _priorOutputs: AgentContext['priorOutputs']
  ): RecommendationOutput {
    return {
      agentName: 'recommendation',
      decision: 'refer_manual_review',
      confidence: 50,
      rationale: ['Workflow halted due to critical finding in specialist agent.'],
      summary: 'Recommend REFERRAL for manual review due to early termination.',
    };
  }

  private createSkippedTraces(agentName: AgentName): AgentExecutionTrace {
    return {
      id: uuidv4(),
      agentName,
      status: 'skipped',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      inputSummary: 'Skipped due to early workflow termination',
      retryCount: 0,
    };
  }

  determineTermination(
    recommendation: RecommendationOutput,
    autonomyMode: AutonomyMode,
    hasException: boolean
  ): WorkflowTerminationResult {
    if (autonomyMode === 'human_approval_required') {
      return {
        status: 'awaiting_human_approval',
        finalDecision: undefined,
        requiresHumanAction: true,
        exceptionReason: 'Human approval required before executing recommendation.',
      };
    }

    const canAutoComplete =
      !hasException &&
      recommendation.decision === 'approve' &&
      recommendation.confidence >= 70;

    if (!canAutoComplete) {
      const exceptionReason =
        recommendation.decision === 'refer_manual_review'
          ? 'Recommendation requires manual review.'
          : recommendation.decision === 'reject'
            ? 'Rejection requires human confirmation before execution.'
            : hasException
              ? 'Exception detected during agent execution.'
              : `Low confidence (${recommendation.confidence}%) requires human review.`;

      return {
        status: 'awaiting_exception_review',
        finalDecision: undefined,
        requiresHumanAction: true,
        exceptionReason,
      };
    }

    return {
      status: 'completed',
      finalDecision: recommendation.decision as RecommendationDecision,
      requiresHumanAction: false,
    };
  }
}
