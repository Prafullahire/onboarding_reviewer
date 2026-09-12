export interface CustomerProfile {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  email: string;
  phone: string;
  customerType: 'individual' | 'business';
}

export interface IdentityDetails {
  idType: 'passport' | 'national_id' | 'drivers_license';
  idNumber: string;
  issuingCountry: string;
  expiryDate: string;
  nameOnDocument: string;
}

export interface AddressDetails {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: 'residential' | 'business' | 'mailing';
}

export interface EmploymentInfo {
  status: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student';
  employerName?: string;
  jobTitle?: string;
  annualIncome?: number;
  industry?: string;
  yearsEmployed?: number;
}

export interface SupportingDocument {
  documentType: string;
  fileName: string;
  uploadedAt: string;
  verified: boolean;
}

export interface RiskIndicators {
  pepStatus: boolean;
  sanctionsMatch: boolean;
  adverseMedia: boolean;
  highRiskCountry: boolean;
  unusualTransactionPattern: boolean;
  sourceOfFundsUnclear: boolean;
}

export interface OnboardingCaseData {
  customerProfile: CustomerProfile;
  identityDetails: IdentityDetails;
  addressDetails: AddressDetails;
  employmentInfo: EmploymentInfo;
  supportingDocuments: SupportingDocument[];
  riskIndicators: RiskIndicators;
}

export interface OnboardingCase {
  id: string;
  referenceNumber: string;
  title: string;
  caseData: OnboardingCaseData;
  createdAt: string;
  updatedAt: string;
}

export type AgentName =
  | 'document_completeness'
  | 'identity_consistency'
  | 'risk_indicator'
  | 'recommendation';

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type RecommendationDecision = 'approve' | 'reject' | 'refer_manual_review';
export type AutonomyMode = 'human_approval_required' | 'exception_only_review';
export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'awaiting_human_approval'
  | 'awaiting_exception_review'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AgentOutput {
  agentName: AgentName;
  summary: string;
  [key: string]: unknown;
}

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

export interface RecommendationOutput {
  agentName: 'recommendation';
  decision: RecommendationDecision;
  confidence: number;
  rationale: string[];
  conditions?: string[];
  summary: string;
}

export interface ReviewWorkflow {
  id: string;
  caseId: string;
  autonomyMode: AutonomyMode;
  status: WorkflowStatus;
  traces: AgentExecutionTrace[];
  recommendation?: RecommendationOutput;
  finalDecision?: RecommendationDecision;
  humanDecision?: string;
  humanDecisionNotes?: string;
  humanDecisionAt?: string;
  requiresHumanAction: boolean;
  exceptionReason?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentInfo {
  name: AgentName;
  description: string;
  goal: string;
}
