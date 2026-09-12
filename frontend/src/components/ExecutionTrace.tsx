import type { AgentExecutionTrace, AgentName } from '../types';

interface ExecutionTraceProps {
  traces: AgentExecutionTrace[];
}

const AGENT_LABELS: Record<AgentName, string> = {
  document_completeness: 'Document Completeness',
  identity_consistency: 'Identity Consistency',
  risk_indicator: 'Risk Assessment',
  recommendation: 'Final Recommendation',
};

const AGENT_ABBR: Record<AgentName, string> = {
  document_completeness: 'DOC',
  identity_consistency: 'ID',
  risk_indicator: 'RSK',
  recommendation: 'REC',
};

export function ExecutionTrace({ traces }: ExecutionTraceProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Execution Trace</h2>
          <p>{traces.length > 0 ? `${traces.length} agent steps completed` : 'Awaiting review start'}</p>
        </div>
      </div>
      <div className="card-body">
        {traces.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            Start a review to see the agent pipeline execution trace.
          </p>
        ) : (
          <div className="timeline">
            {traces.map((trace, index) => (
              <TraceItem key={trace.id} trace={trace} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TraceItem({ trace, index }: { trace: AgentExecutionTrace; index: number }) {
  const dotClass = trace.status === 'completed' ? 'completed' : trace.status === 'failed' ? 'failed' : 'skipped';

  return (
    <div className="timeline-item">
      <div className={`timeline-dot ${dotClass}`} />
      <div className="timeline-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div className="agent-chip-icon" style={{ margin: 0, flexShrink: 0 }}>
              {AGENT_ABBR[trace.agentName]}
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Step {index + 1}
              </div>
              <h4>{AGENT_LABELS[trace.agentName]}</h4>
              <div className="timeline-meta">{trace.inputSummary}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span className={`badge badge-${trace.status === 'completed' ? 'success' : trace.status === 'failed' ? 'danger' : 'neutral'}`}>
              {trace.status}
            </span>
            {trace.durationMs !== undefined && (
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.375rem', fontFamily: 'var(--font-mono)' }}>
                {trace.durationMs}ms
              </div>
            )}
          </div>
        </div>

        {trace.error && (
          <div style={{ marginTop: '0.625rem', fontSize: '0.8125rem', color: 'var(--danger)' }}>
            {trace.error}
          </div>
        )}

        {trace.output && (
          <details style={{ marginTop: '0.625rem' }}>
            <summary>View structured output</summary>
            <pre className="code-block">{JSON.stringify(trace.output, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
