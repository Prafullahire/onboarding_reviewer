import { z } from 'zod';
import type { OnboardingCaseData } from './onboarding-case.js';

export type AgentName =
  | 'document_completeness'
  | 'identity_consistency'
  | 'risk_indicator'
  | 'recommendation';

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export type RecommendationDecision = 'approve' | 'reject' | 'refer_manual_review';

export type AutonomyMode = 'human_approval_required' | 'exception_only_review';

export const DocumentFindingSchema = z.object({
  documentType: z.string(),
  status: z.enum(['present', 'missing', 'invalid', 'unverified']),
  message: z.string(),
});

export const DocumentCompletenessOutputSchema = z.object({
  agentName: z.literal('document_completeness'),
  completenessScore: z.number().min(0).max(100),
  requiredDocuments: z.array(z.string()),
  findings: z.array(DocumentFindingSchema),
  isComplete: z.boolean(),
  summary: z.string(),
});

export const IdentityCheckSchema = z.object({
  field: z.string(),
  status: z.enum(['consistent', 'inconsistent', 'missing', 'expired']),
  expected: z.string().optional(),
  actual: z.string().optional(),
  message: z.string(),
});

export const IdentityConsistencyOutputSchema = z.object({
  agentName: z.literal('identity_consistency'),
  consistencyScore: z.number().min(0).max(100),
  checks: z.array(IdentityCheckSchema),
  isConsistent: z.boolean(),
  summary: z.string(),
});

export const RiskFactorSchema = z.object({
  factor: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  triggered: z.boolean(),
  description: z.string(),
});

export const RiskIndicatorOutputSchema = z.object({
  agentName: z.literal('risk_indicator'),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  factors: z.array(RiskFactorSchema),
  summary: z.string(),
});

export const RecommendationOutputSchema = z.object({
  agentName: z.literal('recommendation'),
  decision: z.enum(['approve', 'reject', 'refer_manual_review']),
  confidence: z.number().min(0).max(100),
  rationale: z.array(z.string()),
  conditions: z.array(z.string()).optional(),
  summary: z.string(),
});

export type DocumentCompletenessOutput = z.infer<typeof DocumentCompletenessOutputSchema>;
export type IdentityConsistencyOutput = z.infer<typeof IdentityConsistencyOutputSchema>;
export type RiskIndicatorOutput = z.infer<typeof RiskIndicatorOutputSchema>;
export type RecommendationOutput = z.infer<typeof RecommendationOutputSchema>;

export type AgentOutput =
  | DocumentCompletenessOutput
  | IdentityConsistencyOutput
  | RiskIndicatorOutput
  | RecommendationOutput;

export interface AgentExecutionTrace {
  id: string;
  agentName: AgentName;
  status: AgentStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  inputSummary: string;
  output?: AgentOutput;
  error?: string;
  retryCount: number;
}

export interface AgentContext {
  caseId: string;
  caseData: OnboardingCaseData;
  priorOutputs: Partial<{
    document_completeness: DocumentCompletenessOutput;
    identity_consistency: IdentityConsistencyOutput;
    risk_indicator: RiskIndicatorOutput;
  }>;
}

export interface AgentResult<T extends AgentOutput = AgentOutput> {
  success: boolean;
  output?: T;
  error?: string;
}

export interface Agent<TOutput extends AgentOutput = AgentOutput> {
  readonly name: AgentName;
  readonly description: string;
  readonly goal: string;
  execute(context: AgentContext): Promise<AgentResult<TOutput>>;
}
