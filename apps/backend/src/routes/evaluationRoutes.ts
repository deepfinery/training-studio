import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authMiddleware';
import { listEvaluations, recordEvaluation } from '../services/evaluationService';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const evaluations = await listEvaluations(req.user!.id);
    res.json({ evaluations });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to load evaluations' });
  }
});

router.post('/', async (req, res) => {
  const schema = z.object({
    jobId: z.string().optional(),
    fileKey: z.string().optional(),
    label: z.string().optional(),
    score: z.number().min(0).max(1).optional(),
    notes: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const record = await recordEvaluation(req.user!.id, parsed.data);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to record evaluation' });
  }
});

export default router;
