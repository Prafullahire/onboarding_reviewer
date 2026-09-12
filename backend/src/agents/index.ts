import { DocumentCompletenessAgent } from './document-completeness-agent.js';
import { IdentityConsistencyAgent } from './identity-consistency-agent.js';
import { RiskIndicatorAgent } from './risk-indicator-agent.js';
import { RecommendationAgent } from './recommendation-agent.js';
import type { Agent, AgentName } from '../types/agent.js';

export function createAgents(): Map<AgentName, Agent> {
  const agents = new Map<AgentName, Agent>();
  agents.set('document_completeness', new DocumentCompletenessAgent());
  agents.set('identity_consistency', new IdentityConsistencyAgent());
  agents.set('risk_indicator', new RiskIndicatorAgent());
  agents.set('recommendation', new RecommendationAgent());
  return agents;
}

export {
  DocumentCompletenessAgent,
  IdentityConsistencyAgent,
  RiskIndicatorAgent,
  RecommendationAgent,
};
