import type { OnboardingCase } from '../types';

interface CaseDetailProps {
  case: OnboardingCase;
}

export function CaseDetail({ case: caseItem }: CaseDetailProps) {
  const { caseData } = caseItem;
  const riskCount = Object.values(caseData.riskIndicators).filter(Boolean).length;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Case Overview</h2>
          <p>{caseData.customerProfile.fullName} · {caseData.customerProfile.customerType}</p>
        </div>
        {riskCount > 0 && (
          <span className="badge badge-danger">{riskCount} Risk Flag{riskCount > 1 ? 's' : ''}</span>
        )}
      </div>
      <div className="card-body">
        <div className="detail-grid">
          <Section title="Customer Profile">
            <Field label="Full Name" value={caseData.customerProfile.fullName} />
            <Field label="Date of Birth" value={caseData.customerProfile.dateOfBirth} />
            <Field label="Nationality" value={caseData.customerProfile.nationality} />
            <Field label="Email" value={caseData.customerProfile.email} />
            <Field label="Phone" value={caseData.customerProfile.phone} />
          </Section>

          <Section title="Identity">
            <Field label="ID Type" value={caseData.identityDetails.idType.replace(/_/g, ' ')} />
            <Field label="ID Number" value={caseData.identityDetails.idNumber} />
            <Field label="Name on Document" value={caseData.identityDetails.nameOnDocument} />
            <Field label="Issuing Country" value={caseData.identityDetails.issuingCountry} />
            <Field label="Expiry Date" value={caseData.identityDetails.expiryDate} />
          </Section>

          <Section title="Address">
            <Field label="Street" value={caseData.addressDetails.street} />
            <Field label="City / State" value={`${caseData.addressDetails.city}, ${caseData.addressDetails.state}`} />
            <Field label="Postal Code" value={caseData.addressDetails.postalCode} />
            <Field label="Country" value={caseData.addressDetails.country} />
          </Section>

          <Section title="Employment">
            <Field label="Status" value={caseData.employmentInfo.status.replace(/_/g, ' ')} />
            <Field label="Employer" value={caseData.employmentInfo.employerName ?? '—'} />
            <Field label="Job Title" value={caseData.employmentInfo.jobTitle ?? '—'} />
            <Field label="Annual Income" value={caseData.employmentInfo.annualIncome?.toLocaleString() ?? '—'} />
          </Section>

          <Section title="Documents">
            {caseData.supportingDocuments.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No documents uploaded</p>
            ) : (
              caseData.supportingDocuments.map((doc, i) => (
                <div key={i} className="detail-row">
                  <span>{doc.documentType.replace(/_/g, ' ')}</span>
                  <span className={doc.verified ? 'badge badge-success' : 'badge badge-warning'}>
                    {doc.verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              ))
            )}
          </Section>

          <Section title="Risk Indicators">
            {Object.entries(caseData.riskIndicators).map(([key, value]) => (
              <div key={key} className="detail-row">
                <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className={value ? 'badge badge-danger' : 'badge badge-success'}>
                  {value ? 'Yes' : 'No'}
                </span>
              </div>
            ))}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="detail-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <div className="detail-value">{value}</div>
    </div>
  );
}
