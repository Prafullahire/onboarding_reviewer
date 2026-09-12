import type { AgentInfo } from '../types';

interface AgentInfoPanelProps {
  agents: AgentInfo[];
  compact?: boolean;
}

const AGENT_ABBR: Record<string, string> = {
  document_completeness: 'DOC',
  identity_consistency: 'ID',
  risk_indicator: 'RSK',
  recommendation: 'REC',
};

export function AgentInfoPanel({ agents, compact }: AgentInfoPanelProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Specialist Agents</h2>
          {!compact && <p>Four agents collaborate in a supervised pipeline</p>}
        </div>
      </div>
      <div className="card-body">
        <div className="agents-strip">
          {agents.map((agent) => (
            <div key={agent.name} className="agent-chip">
              <div className="agent-chip-icon">{AGENT_ABBR[agent.name] ?? 'AI'}</div>
              <div className="agent-chip-name">
                {agent.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </div>
              {!compact && (
                <div className="agent-chip-desc">{agent.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
