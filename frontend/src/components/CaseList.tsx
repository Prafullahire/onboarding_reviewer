import type { OnboardingCase } from '../types';

interface CaseListProps {
  cases: OnboardingCase[];
  selectedId: string | null;
  onSelect: (caseId: string) => void;
  onCreateNew: () => void;
  onUpload: () => void;
}

export function CaseList({ cases, selectedId, onSelect, onCreateNew, onUpload }: CaseListProps) {
  return (
    <>
      <div className="sidebar-actions">
        <button className="btn-primary btn-block" onClick={onCreateNew}>
          + New Case
        </button>
        <button className="btn-secondary btn-block" onClick={onUpload}>
          Upload JSON
        </button>
      </div>

      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
        Cases ({cases.length})
      </div>

      <div className="case-list">
        {cases.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            No cases yet. Create or upload a synthetic case.
          </p>
        )}
        {cases.map((caseItem) => (
          <button
            key={caseItem.id}
            type="button"
            className={`case-item ${selectedId === caseItem.id ? 'active' : ''}`}
            onClick={() => onSelect(caseItem.id)}
          >
            <div className="case-item-title">{caseItem.title}</div>
            <div className="case-item-ref">{caseItem.referenceNumber}</div>
            <div className="case-item-name">{caseItem.caseData.customerProfile.fullName}</div>
          </button>
        ))}
      </div>
    </>
  );
}
