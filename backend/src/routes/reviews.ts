import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { ReviewService } from '../services/review-service.js';

const router = Router();
const reviewService = new ReviewService();

const StartReviewSchema = z.object({
  caseId: z.string().min(1),
  autonomyMode: z.enum(['human_approval_required', 'exception_only_review']),
});

const HumanDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'refer_manual_review', 'override']),
  notes: z.string().optional(),
});

router.post('/start', async (req: Request, res: Response) => {
  try {
    const parsed = StartReviewSchema.parse(req.body);
    const workflow = await reviewService.startReview(parsed.caseId, parsed.autonomyMode);
    res.status(201).json(workflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/case/:caseId', async (req: Request, res: Response) => {
  try {
    const workflows = await reviewService.listByCase(req.params.caseId);
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const workflow = await reviewService.getById(req.params.id);
    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/:id/decision', async (req: Request, res: Response) => {
  try {
    const parsed = HumanDecisionSchema.parse(req.body);
    const workflow = await reviewService.submitHumanDecision(req.params.id, parsed);
    res.json(workflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not awaiting') ? 409 : 500;
    res.status(status).json({ error: message });
  }
});

router.get('/:id/audit', async (req: Request, res: Response) => {
  try {
    const auditLog = await reviewService.getAuditLog(req.params.id);
    res.json(auditLog);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
