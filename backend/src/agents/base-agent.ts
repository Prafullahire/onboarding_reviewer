import type { Agent, AgentContext, AgentName, AgentOutput, AgentResult } from '../types/agent.js';

export abstract class BaseAgent<TOutput extends AgentOutput> implements Agent<TOutput> {
  abstract readonly name: AgentName;
  abstract readonly description: string;
  abstract readonly goal: string;

  protected abstract analyze(context: AgentContext): Promise<TOutput>;

  async execute(context: AgentContext): Promise<AgentResult<TOutput>> {
    try {
      const output = await this.analyze(context);
      return { success: true, output };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown agent error';
      return { success: false, error: message };
    }
  }
}
