import { BaseAgent } from './base-agent.js';
import type { AgentContext, RiskIndicatorOutput } from '../types/agent.js';

export class RiskIndicatorAgent extends BaseAgent<RiskIndicatorOutput> {
  readonly name = 'risk_indicator' as const;
  readonly description =
    'Assesses AML/KYC risk indicators including PEP status, sanctions, adverse media, and transaction patterns.';
  readonly goal =
    'Produce a quantified risk score and severity-classified risk factors to inform the final recommendation.';

  protected async analyze(context: AgentContext): Promise<RiskIndicatorOutput> {
    const { riskIndicators, employmentInfo } = context.caseData;
    const factors: RiskIndicatorOutput['factors'] = [];

    factors.push({
      factor: 'PEP Status',
      severity: 'high',
      triggered: riskIndicators.pepStatus,
      description: riskIndicators.pepStatus
        ? 'Customer is a Politically Exposed Person (PEP).'
        : 'No PEP status identified.',
    });

    factors.push({
      factor: 'Sanctions Match',
      severity: 'critical',
      triggered: riskIndicators.sanctionsMatch,
      description: riskIndicators.sanctionsMatch
        ? 'Potential sanctions list match detected.'
        : 'No sanctions list matches.',
    });

    factors.push({
      factor: 'Adverse Media',
      severity: 'high',
      triggered: riskIndicators.adverseMedia,
      description: riskIndicators.adverseMedia
        ? 'Adverse media references found.'
        : 'No adverse media identified.',
    });

    factors.push({
      factor: 'High Risk Country',
      severity: 'medium',
      triggered: riskIndicators.highRiskCountry,
      description: riskIndicators.highRiskCountry
        ? 'Customer associated with a high-risk jurisdiction.'
        : 'No high-risk jurisdiction flags.',
    });

    factors.push({
      factor: 'Unusual Transaction Pattern',
      severity: 'medium',
      triggered: riskIndicators.unusualTransactionPattern,
      description: riskIndicators.unusualTransactionPattern
        ? 'Unusual transaction patterns detected.'
        : 'No unusual transaction patterns.',
    });

    factors.push({
      factor: 'Source of Funds',
      severity: 'high',
      triggered: riskIndicators.sourceOfFundsUnclear,
      description: riskIndicators.sourceOfFundsUnclear
        ? 'Source of funds is unclear or undocumented.'
        : 'Source of funds appears documented.',
    });

    if (employmentInfo.annualIncome && employmentInfo.annualIncome > 250000) {
      factors.push({
        factor: 'High Income',
        severity: 'low',
        triggered: true,
        description: `Reported annual income (${employmentInfo.annualIncome}) exceeds standard threshold.`,
      });
    }

    const severityWeights: Record<string, number> = {
      critical: 40,
      high: 25,
      medium: 15,
      low: 5,
    };

    let riskScore = 0;
    for (const factor of factors) {
      if (factor.triggered) {
        riskScore += severityWeights[factor.severity];
      }
    }
    riskScore = Math.min(100, riskScore);

    let riskLevel: RiskIndicatorOutput['riskLevel'];
    if (riskScore >= 70) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 25) riskLevel = 'medium';
    else riskLevel = 'low';

    const triggeredFactors = factors.filter((f) => f.triggered);

    return {
      agentName: 'risk_indicator',
      riskScore,
      riskLevel,
      factors,
      summary: triggeredFactors.length === 0
        ? 'Low risk profile with no significant risk indicators triggered.'
        : `${triggeredFactors.length} risk factor(s) triggered. Overall risk level: ${riskLevel}.`,
    };
  }
}
