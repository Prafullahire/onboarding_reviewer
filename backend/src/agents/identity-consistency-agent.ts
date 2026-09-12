import { BaseAgent } from './base-agent.js';
import type { AgentContext, IdentityConsistencyOutput } from '../types/agent.js';

function tokenizeName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

function givenNamesMatch(profileGiven: string[], docGiven: string[]): boolean {
  if (profileGiven.length === 0 && docGiven.length === 0) return true;

  return (
    profileGiven.every((pg) =>
      docGiven.some(
        (dg) =>
          pg === dg ||
          (dg.length === 1 && pg[0] === dg) ||
          (pg.length === 1 && dg[0] === pg)
      )
    ) &&
    docGiven.every((dg) =>
      profileGiven.some(
        (pg) =>
          pg === dg ||
          (dg.length === 1 && pg[0] === dg) ||
          (pg.length === 1 && dg[0] === pg)
      )
    )
  );
}

function surnamesMatch(profileSurname: string, docSurname: string): boolean {
  if (profileSurname === docSurname) return true;
  if (profileSurname.length < 3 || docSurname.length < 3) return false;
  return profileSurname.startsWith(docSurname) || docSurname.startsWith(profileSurname);
}

function namesMatch(profileName: string, documentName: string): boolean {
  const profileTokens = tokenizeName(profileName);
  const docTokens = tokenizeName(documentName);

  if (profileTokens.length === 0 || docTokens.length === 0) return false;
  if (profileTokens.join(' ') === docTokens.join(' ')) return true;

  const profileSurname = profileTokens[profileTokens.length - 1];
  const docSurname = docTokens[docTokens.length - 1];

  if (!surnamesMatch(profileSurname, docSurname)) return false;

  const profileGiven = profileTokens.slice(0, -1);
  const docGiven = docTokens.slice(0, -1);

  return givenNamesMatch(profileGiven, docGiven);
}

export class IdentityConsistencyAgent extends BaseAgent<IdentityConsistencyOutput> {
  readonly name = 'identity_consistency' as const;
  readonly description =
    'Cross-validates identity information across customer profile, ID document, and address records.';
  readonly goal =
    'Detect name mismatches, expired documents, and nationality inconsistencies that could indicate fraud.';

  protected async analyze(context: AgentContext): Promise<IdentityConsistencyOutput> {
    const { customerProfile, identityDetails, addressDetails } = context.caseData;
    const checks: IdentityConsistencyOutput['checks'] = [];

    const nameConsistent = namesMatch(customerProfile.fullName, identityDetails.nameOnDocument);
    checks.push({
      field: 'name_consistency',
      status: nameConsistent ? 'consistent' : 'inconsistent',
      expected: customerProfile.fullName,
      actual: identityDetails.nameOnDocument,
      message: nameConsistent
        ? 'Name on ID document matches customer profile.'
        : 'Name on ID document does not match customer profile.',
    });

    const expiryDate = new Date(identityDetails.expiryDate);
    const isExpired = expiryDate < new Date();
    checks.push({
      field: 'document_expiry',
      status: isExpired ? 'expired' : 'consistent',
      expected: 'Valid (not expired)',
      actual: identityDetails.expiryDate,
      message: isExpired
        ? 'Identity document has expired.'
        : 'Identity document is within validity period.',
    });

    const nationalityMatch =
      customerProfile.nationality.toLowerCase() === identityDetails.issuingCountry.toLowerCase() ||
      addressDetails.country.toLowerCase() === identityDetails.issuingCountry.toLowerCase();
    checks.push({
      field: 'nationality_consistency',
      status: nationalityMatch ? 'consistent' : 'inconsistent',
      expected: customerProfile.nationality,
      actual: identityDetails.issuingCountry,
      message: nationalityMatch
        ? 'Nationality and issuing country are aligned.'
        : 'Nationality does not align with document issuing country or residence.',
    });

    const dobProvided = customerProfile.dateOfBirth.length > 0;
    checks.push({
      field: 'date_of_birth',
      status: dobProvided ? 'consistent' : 'missing',
      message: dobProvided
        ? 'Date of birth provided in customer profile.'
        : 'Date of birth is missing from customer profile.',
    });

    const passedChecks = checks.filter((c) => c.status === 'consistent').length;
    const consistencyScore = Math.round((passedChecks / checks.length) * 100);
    const isConsistent = checks.every((c) => c.status !== 'inconsistent' && c.status !== 'expired');

    return {
      agentName: 'identity_consistency',
      consistencyScore,
      checks,
      isConsistent,
      summary: isConsistent
        ? 'Identity information is consistent across all data sources.'
        : 'Identity inconsistencies detected requiring further review.',
    };
  }
}
