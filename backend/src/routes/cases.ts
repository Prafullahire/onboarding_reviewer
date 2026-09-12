import { Router, type Request, type Response } from 'express';
import { CaseService } from '../services/case-service.js';
import { OnboardingCaseDataSchema } from '../types/onboarding-case.js';

const router = Router();
const caseService = new CaseService();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const cases = await caseService.list();
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const caseRecord = await caseService.getById(req.params.id);
    if (!caseRecord) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    res.json(caseRecord);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, caseData } = req.body as { title: string; caseData: unknown };
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    const validated = OnboardingCaseDataSchema.parse(caseData);
    const created = await caseService.create(title, validated);
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid case data', details: error });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await caseService.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
