import { describe, it, expect } from 'vitest';
import { WorkflowOrchestrator } from '../orchestrator/workflow-orchestrator.js';
import type { RecommendationOutput } from '../types/agent.js';

describe('WorkflowOrchestrator termination logic', () => {
  const orchestrator = new WorkflowOrchestrator();

  const approveRecommendation: RecommendationOutput = {
    agentName: 'recommendation',
    decision: 'approve',
    confidence: 92,
    rationale: ['All checks passed'],
    summary: 'Recommend APPROVAL',
  };

  const referRecommendation: RecommendationOutput = {
    agentName: 'recommendation',
    decision: 'refer_manual_review',
    confidence: 75,
    rationale: ['Incomplete documents'],
    summary: 'Recommend REFERRAL',
  };

  const lowConfidenceRecommendation: RecommendationOutput = {
    agentName: 'recommendation',
    decision: 'approve',
    confidence: 60,
    rationale: ['Borderline case'],
    summary: 'Recommend APPROVAL with low confidence',
  };

  const rejectRecommendation: RecommendationOutput = {
    agentName: 'recommendation',
    decision: 'reject',
    confidence: 95,
    rationale: ['Critical risk indicators'],
    summary: 'Recommend REJECTION',
  };

  it('always requires human action in human_approval_required mode', () => {
    const result = orchestrator.determineTermination(approveRecommendation, 'human_approval_required', false);
    expect(result.status).toBe('awaiting_human_approval');
    expect(result.requiresHumanAction).toBe(true);
    expect(result.finalDecision).toBeUndefined();
  });

  it('auto-completes clear approvals in exception_only_review mode', () => {
    const result = orchestrator.determineTermination(approveRecommendation, 'exception_only_review', false);
    expect(result.status).toBe('completed');
    expect(result.finalDecision).toBe('approve');
    expect(result.requiresHumanAction).toBe(false);
  });

  it('pauses for manual review when recommendation is refer', () => {
    const result = orchestrator.determineTermination(referRecommendation, 'exception_only_review', false);
    expect(result.status).toBe('awaiting_exception_review');
    expect(result.requiresHumanAction).toBe(true);
  });

  it('pauses when confidence is below threshold', () => {
    const result = orchestrator.determineTermination(lowConfidenceRecommendation, 'exception_only_review', false);
    expect(result.status).toBe('awaiting_exception_review');
    expect(result.requiresHumanAction).toBe(true);
  });

  it('requires human confirmation for rejections in exception_only_review mode', () => {
    const result = orchestrator.determineTermination(rejectRecommendation, 'exception_only_review', false);
    expect(result.status).toBe('awaiting_exception_review');
    expect(result.requiresHumanAction).toBe(true);
    expect(result.exceptionReason).toContain('Rejection requires human confirmation');
  });
});
