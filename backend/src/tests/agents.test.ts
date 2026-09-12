import { describe, it, expect } from 'vitest';
import { DocumentCompletenessAgent } from '../agents/document-completeness-agent.js';
import { IdentityConsistencyAgent } from '../agents/identity-consistency-agent.js';
import { RiskIndicatorAgent } from '../agents/risk-indicator-agent.js';
import { RecommendationAgent } from '../agents/recommendation-agent.js';
import type { AgentContext } from '../types/agent.js';
import type { OnboardingCaseData as CaseData } from '../types/onboarding-case.js';

const completeCase: CaseData = {
  customerProfile: {
    fullName: 'Alexandra Chen',
    dateOfBirth: '1990-03-15',
    nationality: 'United States',
    email: 'alexandra.chen@example-mail.com',
    phone: '+1-555-0101',
    customerType: 'individual',
  },
  identityDetails: {
    idType: 'passport',
    idNumber: 'P12345678',
    issuingCountry: 'United States',
    expiryDate: '2030-06-30',
    nameOnDocument: 'Alexandra Chen',
  },
  addressDetails: {
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62704',
    country: 'United States',
    addressType: 'residential',
  },
  employmentInfo: {
    status: 'employed',
    employerName: 'TechCorp',
    jobTitle: 'Engineer',
    annualIncome: 95000,
  },
  supportingDocuments: [
    { documentType: 'passport', fileName: 'p.pdf', uploadedAt: '2026-01-01', verified: true },
    { documentType: 'proof_of_address', fileName: 'a.pdf', uploadedAt: '2026-01-01', verified: true },
    { documentType: 'proof_of_income', fileName: 'i.pdf', uploadedAt: '2026-01-01', verified: true },
  ],
  riskIndicators: {
    pepStatus: false,
    sanctionsMatch: false,
    adverseMedia: false,
    highRiskCountry: false,
    unusualTransactionPattern: false,
    sourceOfFundsUnclear: false,
  },
};

const inconsistentCase: CaseData = {
  ...completeCase,
  customerProfile: { ...completeCase.customerProfile, fullName: 'Sarah Johnson' },
  identityDetails: {
    ...completeCase.identityDetails,
    idType: 'drivers_license',
    nameOnDocument: 'S. J. Williams',
    issuingCountry: 'United Kingdom',
  },
  supportingDocuments: [
    { documentType: 'drivers_license', fileName: 'dl.pdf', uploadedAt: '2026-01-01', verified: true },
    { documentType: 'proof_of_address', fileName: 'a.pdf', uploadedAt: '2026-01-01', verified: true },
  ],
};

function baseContext(caseData: CaseData, priorOutputs: AgentContext['priorOutputs'] = {}): AgentContext {
  return { caseId: 'test', caseData, priorOutputs };
}

describe('DocumentCompletenessAgent', () => {
  const agent = new DocumentCompletenessAgent();

  it('marks a fully documented case as complete', async () => {
    const result = await agent.execute(baseContext(completeCase));
    expect(result.success).toBe(true);
    expect(result.output?.isComplete).toBe(true);
    expect(result.output?.completenessScore).toBeGreaterThanOrEqual(80);
  });

  it('flags missing proof of income for employed applicants', async () => {
    const caseWithoutIncome = {
      ...completeCase,
      supportingDocuments: completeCase.supportingDocuments.filter((d) => d.documentType !== 'proof_of_income'),
    };
    const result = await agent.execute(baseContext(caseWithoutIncome));
    expect(result.output?.isComplete).toBe(false);
    expect(result.output?.findings.some((f) => f.documentType === 'proof_of_income' && f.status === 'missing')).toBe(true);
  });
});

describe('IdentityConsistencyAgent', () => {
  const agent = new IdentityConsistencyAgent();

  it('confirms matching identity data', async () => {
    const result = await agent.execute(baseContext(completeCase));
    expect(result.output?.isConsistent).toBe(true);
  });

  it('detects name mismatch', async () => {
    const result = await agent.execute(baseContext(inconsistentCase));
    expect(result.output?.isConsistent).toBe(false);
    expect(result.output?.checks.some((c) => c.field === 'name_consistency' && c.status === 'inconsistent')).toBe(true);
  });
});

describe('RiskIndicatorAgent', () => {
  const agent = new RiskIndicatorAgent();

  it('returns low risk for clean profile', async () => {
    const result = await agent.execute(baseContext(completeCase));
    expect(result.output?.riskLevel).toBe('low');
    expect(result.output?.riskScore).toBeLessThan(25);
  });

  it('elevates risk when PEP and adverse media triggered', async () => {
    const risky = {
      ...completeCase,
      riskIndicators: {
        ...completeCase.riskIndicators,
        pepStatus: true,
        adverseMedia: true,
        highRiskCountry: true,
      },
    };
    const result = await agent.execute(baseContext(risky));
    expect(result.output?.riskLevel).toMatch(/medium|high|critical/);
    expect(result.output?.riskScore).toBeGreaterThan(25);
  });
});

describe('RecommendationAgent', () => {
  const agent = new RecommendationAgent();

  it('recommends approval when all specialist agents pass', async () => {
    const docAgent = new DocumentCompletenessAgent();
    const idAgent = new IdentityConsistencyAgent();
    const riskAgent = new RiskIndicatorAgent();

    const doc = await docAgent.execute(baseContext(completeCase));
    const id = await idAgent.execute(baseContext(completeCase));
    const risk = await riskAgent.execute(baseContext(completeCase));

    const result = await agent.execute(
      baseContext(completeCase, {
        document_completeness: doc.output!,
        identity_consistency: id.output!,
        risk_indicator: risk.output!,
      })
    );

    expect(result.output?.decision).toBe('approve');
    expect(result.output?.rationale.length).toBeGreaterThanOrEqual(3);
  });

  it('refers inconsistent identity for manual review', async () => {
    const docAgent = new DocumentCompletenessAgent();
    const idAgent = new IdentityConsistencyAgent();
    const riskAgent = new RiskIndicatorAgent();

    const doc = await docAgent.execute(baseContext(inconsistentCase));
    const id = await idAgent.execute(baseContext(inconsistentCase));
    const risk = await riskAgent.execute(baseContext(inconsistentCase));

    const result = await agent.execute(
      baseContext(inconsistentCase, {
        document_completeness: doc.output!,
        identity_consistency: id.output!,
        risk_indicator: risk.output!,
      })
    );

    expect(result.output?.decision).toBe('refer_manual_review');
  });
});
