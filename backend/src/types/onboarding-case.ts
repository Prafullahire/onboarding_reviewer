import { z } from 'zod';

export const CustomerProfileSchema = z.object({
  fullName: z.string().min(1),
  dateOfBirth: z.string(),
  nationality: z.string(),
  email: z.string().email(),
  phone: z.string(),
  customerType: z.enum(['individual', 'business']),
});

export const IdentityDetailsSchema = z.object({
  idType: z.enum(['passport', 'national_id', 'drivers_license']),
  idNumber: z.string().min(1),
  issuingCountry: z.string(),
  expiryDate: z.string(),
  nameOnDocument: z.string(),
});

export const AddressDetailsSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
  addressType: z.enum(['residential', 'business', 'mailing']),
});

export const EmploymentInfoSchema = z.object({
  status: z.enum(['employed', 'self_employed', 'unemployed', 'retired', 'student']),
  employerName: z.string().optional(),
  jobTitle: z.string().optional(),
  annualIncome: z.number().optional(),
  industry: z.string().optional(),
  yearsEmployed: z.number().optional(),
});

export const SupportingDocumentSchema = z.object({
  documentType: z.string(),
  fileName: z.string(),
  uploadedAt: z.string(),
  verified: z.boolean().default(false),
});

export const RiskIndicatorsSchema = z.object({
  pepStatus: z.boolean().default(false),
  sanctionsMatch: z.boolean().default(false),
  adverseMedia: z.boolean().default(false),
  highRiskCountry: z.boolean().default(false),
  unusualTransactionPattern: z.boolean().default(false),
  sourceOfFundsUnclear: z.boolean().default(false),
});

export const OnboardingCaseDataSchema = z.object({
  customerProfile: CustomerProfileSchema,
  identityDetails: IdentityDetailsSchema,
  addressDetails: AddressDetailsSchema,
  employmentInfo: EmploymentInfoSchema,
  supportingDocuments: z.array(SupportingDocumentSchema),
  riskIndicators: RiskIndicatorsSchema,
});

export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;
export type IdentityDetails = z.infer<typeof IdentityDetailsSchema>;
export type AddressDetails = z.infer<typeof AddressDetailsSchema>;
export type EmploymentInfo = z.infer<typeof EmploymentInfoSchema>;
export type SupportingDocument = z.infer<typeof SupportingDocumentSchema>;
export type RiskIndicators = z.infer<typeof RiskIndicatorsSchema>;
export type OnboardingCaseData = z.infer<typeof OnboardingCaseDataSchema>;

export interface OnboardingCase {
  id: string;
  referenceNumber: string;
  title: string;
  caseData: OnboardingCaseData;
  createdAt: Date;
  updatedAt: Date;
}
