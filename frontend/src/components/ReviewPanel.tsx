import { useState } from 'react';
import type { AutonomyMode, ReviewWorkflow } from '../types';

interface ReviewPanelProps {
  caseId: string;
  workflow: ReviewWorkflow | null;
  loading: boolean;
  onStartReview: (autonomyMode: AutonomyMode) => void;
  onSubmitDecision: (decision: string, notes: string) => void;
}

export function ReviewPanel({
  workflow,
  loading,
  onStartReview,
  onSubmitDecision,
}: ReviewPanelProps) {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('human_approval_required');
  const [notes, setNotes] = useState('');

  const canSubmitDecision =
    workflow &&
    (workflow.status === 'awaiting_human_approval' || workflow.status === 'awaiting_exception_review');

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Review Workflow</h2>
          <p>AI-assisted decision with human oversight</p>
        </div>
        {workflow && <StatusBadge status={workflow.status} />}
      </div>
      <div className="card-body">
        {!workflow && (
          <>
            <div className="form-group">
              <label>Autonomy Mode</label>
              <select
                value={autonomyMode}
                onChange={(e) => setAutonomyMode(e.target.value as AutonomyMode)}
              >
                <option value="human_approval_required">Human Approval Required</option>
                <option value="exception_only_review">Review Only on Exception</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                {autonomyMode === 'human_approval_required'
                  ? 'Every recommendation requires explicit human sign-off before execution.'
                  : 'Clear approvals auto-complete; exceptions and rejections require human review.'}
              </p>
            </div>
            <button className="btn-accent" onClick={() => onStartReview(autonomyMode)} disabled={loading}>
              {loading ? 'Running Agents…' : 'Start Multi-Agent Review'}
            </button>
          </>
        )}

        {workflow && (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span className="badge badge-neutral">
                {workflow.autonomyMode.replace(/_/g, ' ')}
              </span>
              {workflow.finalDecision && <DecisionBadge decision={workflow.finalDecision} />}
            </div>

            {workflow.recommendation && (
              <RecommendationCard recommendation={workflow.recommendation} />
            )}

            {workflow.exceptionReason && (
              <div className="alert alert-warning" style={{ borderRadius: 'var(--radius-sm)', marginBottom: '1rem', padding: '0.875rem 1rem' }}>
                <strong>Exception: </strong>{workflow.exceptionReason}
              </div>
            )}

            {canSubmitDecision && (
              <div className="decision-panel">
                <h3>Human Decision Required</h3>
                <p style={{ fontSize: '0.8125rem', color: '#92400e' }}>
                  AI recommendation is advisory only. Submit your decision to record the final action.
                </p>
                <textarea
                  placeholder="Add decision notes (optional)…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  style={{ marginTop: '0.75rem' }}
                />
                <div className="decision-actions">
                  <button className="btn-success btn-sm" onClick={() => onSubmitDecision('approve', notes)} disabled={loading}>
                    Approve
                  </button>
                  <button className="btn-danger btn-sm" onClick={() => onSubmitDecision('reject', notes)} disabled={loading}>
                    Reject
                  </button>
                  <button className="btn-warning btn-sm" onClick={() => onSubmitDecision('refer_manual_review', notes)} disabled={loading}>
                    Refer
                  </button>
                  <button className="btn-secondary btn-sm" onClick={() => onSubmitDecision('override', notes)} disabled={loading}>
                    Accept AI Recommendation
                  </button>
                </div>
              </div>
            )}

            {workflow.humanDecision && (
              <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
                <strong>Recorded decision:</strong> {workflow.humanDecision.replace(/_/g, ' ')}
                {workflow.humanDecisionNotes && (
                  <span style={{ color: 'var(--text-secondary)' }}> — {workflow.humanDecisionNotes}</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: NonNullable<ReviewWorkflow['recommendation']> }) {
  return (
    <div className="recommendation-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AI Recommendation
          </div>
          <p style={{ fontSize: '0.875rem', marginTop: '0.375rem', fontWeight: 500 }}>{recommendation.summary}</p>
        </div>
        <DecisionBadge decision={recommendation.decision} />
      </div>

      <div style={{ marginTop: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>Confidence</span>
          <span style={{ fontWeight: 600 }}>{recommendation.confidence}%</span>
        </div>
        <div className="confidence-bar">
          <div className="confidence-fill" style={{ width: `${recommendation.confidence}%` }} />
        </div>
      </div>

      <ul className="rationale-list">
        {recommendation.rationale.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>

      {recommendation.conditions && recommendation.conditions.length > 0 && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
            Conditions
          </div>
          <ul style={{ fontSize: '0.8125rem', color: '#92400e', paddingLeft: '1rem' }}>
            {recommendation.conditions.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'badge-success',
    running: 'badge-info',
    awaiting_human_approval: 'badge-warning',
    awaiting_exception_review: 'badge-warning',
    failed: 'badge-danger',
    pending: 'badge-neutral',
    cancelled: 'badge-neutral',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status.replace(/_/g, ' ')}</span>;
}

function DecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, string> = {
    approve: 'badge-success',
    reject: 'badge-danger',
    refer_manual_review: 'badge-warning',
  };
  return <span className={`badge ${map[decision] ?? 'badge-neutral'}`}>{decision.replace(/_/g, ' ')}</span>;
}
