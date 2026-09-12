import { BaseAgent } from './base-agent.js';
import type { AgentContext, RecommendationOutput } from '../types/agent.js';

export class RecommendationAgent extends BaseAgent<RecommendationOutput> {
  readonly name = 'recommendation' as const;
  readonly description =
    'Synthesizes outputs from all specialist agents to produce a consolidated onboarding recommendation.';
  readonly goal =
    'Generate an explainable approve/reject/refer decision with confidence score and supporting rationale.';

  protected async analyze(context: AgentContext): Promise<RecommendationOutput> {
    const docOutput = context.priorOutputs.document_completeness;
    const identityOutput = context.priorOutputs.identity_consistency;
    const riskOutput = context.priorOutputs.risk_indicator;

    if (!docOutput || !identityOutput || !riskOutput) {
      throw new Error(
        'Recommendation agent requires outputs from document, identity, and risk agents.'
      );
    }

    const rationale: string[] = [];
    const conditions: string[] = [];
    let decision: RecommendationOutput['decision'] = 'approve';
    let confidence = 90;

    rationale.push(`Document completeness: ${docOutput.completenessScore}% - ${docOutput.summary}`);
    rationale.push(`Identity consistency: ${identityOutput.consistencyScore}% - ${identityOutput.summary}`);
    rationale.push(`Risk assessment: score ${riskOutput.riskScore}/100 (${riskOutput.riskLevel}) - ${riskOutput.summary}`);

    if (riskOutput.riskLevel === 'critical' || riskOutput.factors.some((f) => f.factor === 'Sanctions Match' && f.triggered)) {
      decision = 'reject';
      confidence = 95;
      rationale.push('Critical risk indicators mandate rejection.');
    } else if (!docOutput.isComplete) {
      decision = 'refer_manual_review';
      confidence = 75;
      rationale.push('Incomplete documentation requires manual review before approval.');
      conditions.push('Obtain and verify all missing documents.');
    } else if (!identityOutput.isConsistent) {
      decision = 'refer_manual_review';
      confidence = 70;
      rationale.push('Identity inconsistencies require human verification.');
      conditions.push('Verify identity through enhanced due diligence.');
    } else if (riskOutput.riskLevel === 'high' || riskOutput.riskLevel === 'critical') {
      decision = 'refer_manual_review';
      confidence = 80;
      rationale.push('Elevated risk profile requires enhanced due diligence.');
      conditions.push('Complete enhanced due diligence (EDD) review.');
    } else if (riskOutput.riskLevel === 'medium') {
      decision = 'approve';
      confidence = 65;
      rationale.push('Medium risk acceptable with standard monitoring.');
      conditions.push('Apply standard ongoing transaction monitoring.');
    } else {
      decision = 'approve';
      confidence = 92;
      rationale.push('All checks passed with low risk profile.');
    }

    if (docOutput.completenessScore < 50 && decision === 'approve') {
      decision = 'refer_manual_review';
      confidence = 60;
      rationale.push('Low document completeness score overrides approval.');
    }

    const summary =
      decision === 'approve'
        ? `Recommend APPROVAL with ${confidence}% confidence.`
        : decision === 'reject'
          ? `Recommend REJECTION with ${confidence}% confidence.`
          : `Recommend REFERRAL for manual review with ${confidence}% confidence.`;

    return {
      agentName: 'recommendation',
      decision,
      confidence,
      rationale,
      conditions: conditions.length > 0 ? conditions : undefined,
      summary,
    };
  }
}
