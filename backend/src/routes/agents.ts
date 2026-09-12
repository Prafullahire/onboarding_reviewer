import { Router, type Request, type Response } from 'express';
import { createAgents } from '../agents/index.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const agents = createAgents();
  const agentInfo = Array.from(agents.entries()).map(([name, agent]) => ({
    name,
    description: agent.description,
    goal: agent.goal,
  }));
  res.json(agentInfo);
});

export default router;
