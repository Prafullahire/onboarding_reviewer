import { describe, it, expect } from 'vitest';
import { WorkflowOrchestrator } from '../orchestrator/workflow-orchestrator.js';
import type { OnboardingCaseData } from '../types/onboarding-case.js';

const lowRiskCase: OnboardingCaseData = {
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
    employerName: 'TechCorp Solutions',
    jobTitle: 'Software Engineer',
    annualIncome: 95000,
    industry: 'Technology',
    yearsEmployed: 5,
  },
  supportingDocuments: [
    { documentType: 'passport', fileName: 'passport.pdf', uploadedAt: '2026-01-10T10:00:00Z', verified: true },
    { documentType: 'proof_of_address', fileName: 'utility.pdf', uploadedAt: '2026-01-10T10:05:00Z', verified: true },
    { documentType: 'proof_of_income', fileName: 'pay_stub.pdf', uploadedAt: '2026-01-10T10:10:00Z', verified: true },
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

const highRiskCase: OnboardingCaseData = {
  ...lowRiskCase,
  customerProfile: { ...lowRiskCase.customerProfile, fullName: 'Marcus Volkov', nationality: 'Country X' },
  identityDetails: {
    idType: 'national_id',
    idNumber: 'NID-99887766',
    issuingCountry: 'Country X',
    expiryDate: '2025-12-31',
    nameOnDocument: 'M. Volkov',
  },
  supportingDocuments: [
    { documentType: 'national_id', fileName: 'id.jpg', uploadedAt: '2026-01-15T14:00:00Z', verified: false },
  ],
  riskIndicators: {
    pepStatus: true,
    sanctionsMatch: false,
    adverseMedia: true,
    highRiskCountry: true,
    unusualTransactionPattern: true,
    sourceOfFundsUnclear: true,
  },
};

describe('WorkflowOrchestrator', () => {
  const orchestrator = new WorkflowOrchestrator();

  it('runs all four agents and produces a recommendation for a low-risk case', async () => {
    const result = await orchestrator.run('test-case-1', lowRiskCase, 'exception_only_review');

    expect(result.traces).toHaveLength(4);
    expect(result.traces.every((t) => t.status === 'completed')).toBe(true);
    expect(result.recommendation).toBeDefined();
    expect(result.recommendation?.decision).toBe('approve');
    expect(result.termination.status).toBe('completed');
    expect(result.termination.requiresHumanAction).toBe(false);
  });

  it('refers high-risk incomplete cases for manual review', async () => {
    const result = await orchestrator.run('test-case-2', highRiskCase, 'exception_only_review');

    expect(result.recommendation).toBeDefined();
    expect(['refer_manual_review', 'reject']).toContain(result.recommendation?.decision);
    expect(result.termination.requiresHumanAction).toBe(true);
  });

  it('requires human approval when autonomy mode is human_approval_required', async () => {
    const result = await orchestrator.run('test-case-3', lowRiskCase, 'human_approval_required');

    expect(result.termination.status).toBe('awaiting_human_approval');
    expect(result.termination.requiresHumanAction).toBe(true);
    expect(result.termination.finalDecision).toBeUndefined();
  });

  it('produces typed structured outputs from each specialist agent', async () => {
    const result = await orchestrator.run('test-case-4', lowRiskCase, 'exception_only_review');

    const docTrace = result.traces.find((t) => t.agentName === 'document_completeness');
    const identityTrace = result.traces.find((t) => t.agentName === 'identity_consistency');
    const riskTrace = result.traces.find((t) => t.agentName === 'risk_indicator');

    expect(docTrace?.output?.agentName).toBe('document_completeness');
    expect(identityTrace?.output?.agentName).toBe('identity_consistency');
    expect(riskTrace?.output?.agentName).toBe('risk_indicator');
    expect(result.recommendation?.rationale.length).toBeGreaterThan(0);
  });
});
