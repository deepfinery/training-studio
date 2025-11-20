import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const ingestionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sourceType: z.enum(['pdf', 'doc', 'legacy-rules', 'plain-text']),
  fileKey: z.string(),
  tags: z.array(z.string()).optional()
});

router.post('/', (req, res) => {
  const parsed = ingestionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  const now = new Date().toISOString();
  return res.status(201).json({
    ingestionId: `ing_${Date.now()}`,
    status: 'processing',
    createdAt: now,
    updatedAt: now,
    ...parsed.data
  });
});

export default router;
