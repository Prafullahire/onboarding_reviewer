import { BaseAgent } from './base-agent.js';
import type { AgentContext, DocumentCompletenessOutput } from '../types/agent.js';

const REQUIRED_DOCUMENTS = ['passport', 'national_id', 'drivers_license', 'proof_of_address', 'proof_of_income'];

export class DocumentCompletenessAgent extends BaseAgent<DocumentCompletenessOutput> {
  readonly name = 'document_completeness' as const;
  readonly description =
    'Evaluates whether all required supporting documents are present, valid, and verified.';
  readonly goal =
    'Determine document completeness score and identify missing or unverified documents before identity and risk checks proceed.';

  protected async analyze(context: AgentContext): Promise<DocumentCompletenessOutput> {
    const { supportingDocuments } = context.caseData;
    const uploadedTypes = supportingDocuments.map((d) => d.documentType.toLowerCase());

    const hasIdDocument = ['passport', 'national_id', 'drivers_license'].some((t) =>
      uploadedTypes.includes(t)
    );
    const hasProofOfAddress = uploadedTypes.includes('proof_of_address');
    const hasProofOfIncome = uploadedTypes.includes('proof_of_income');

    const findings: DocumentCompletenessOutput['findings'] = [];

    const idType = context.caseData.identityDetails.idType;
    if (!uploadedTypes.includes(idType)) {
      findings.push({
        documentType: idType,
        status: 'missing',
        message: `Primary identity document (${idType}) not uploaded.`,
      });
    } else {
      const doc = supportingDocuments.find((d) => d.documentType === idType);
      findings.push({
        documentType: idType,
        status: doc?.verified ? 'present' : 'unverified',
        message: doc?.verified
          ? `${idType} document present and verified.`
          : `${idType} document uploaded but not verified.`,
      });
    }

    if (!hasProofOfAddress) {
      findings.push({
        documentType: 'proof_of_address',
        status: 'missing',
        message: 'Proof of address document is missing.',
      });
    } else {
      const doc = supportingDocuments.find((d) => d.documentType === 'proof_of_address');
      findings.push({
        documentType: 'proof_of_address',
        status: doc?.verified ? 'present' : 'unverified',
        message: doc?.verified
          ? 'Proof of address present and verified.'
          : 'Proof of address uploaded but not verified.',
      });
    }

    if (!hasProofOfIncome && context.caseData.employmentInfo.status === 'employed') {
      findings.push({
        documentType: 'proof_of_income',
        status: 'missing',
        message: 'Proof of income required for employed applicants but not provided.',
      });
    } else if (hasProofOfIncome) {
      const doc = supportingDocuments.find((d) => d.documentType === 'proof_of_income');
      findings.push({
        documentType: 'proof_of_income',
        status: doc?.verified ? 'present' : 'unverified',
        message: doc?.verified
          ? 'Proof of income present and verified.'
          : 'Proof of income uploaded but not verified.',
      });
    }

    const totalChecks = findings.length;
    const passedChecks = findings.filter((f) => f.status === 'present').length;
    const completenessScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    const isComplete = hasIdDocument && hasProofOfAddress && completenessScore >= 80;

    const missing = findings.filter((f) => f.status === 'missing').map((f) => f.documentType);

    return {
      agentName: 'document_completeness',
      completenessScore,
      requiredDocuments: REQUIRED_DOCUMENTS,
      findings,
      isComplete,
      summary: isComplete
        ? 'All required documents are present and verified.'
        : `Document package incomplete. Missing or unverified: ${missing.join(', ') || 'see findings'}.`,
    };
  }
}
