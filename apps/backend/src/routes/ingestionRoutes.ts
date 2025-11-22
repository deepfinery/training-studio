import { Router } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { requireAuth } from '../middleware/authMiddleware';
import { getCollection } from '../config/database';

const router = Router();

const ingestionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sourceType: z.enum(['pdf', 'doc', 'legacy-rules', 'plain-text']),
  fileKey: z.string(),
  tags: z.array(z.string()).optional()
});

router.use(requireAuth);

router.get('/', async (req, res) => {
  const collection = await getCollection<Record<string, unknown>>('ingestions');
  const items = await collection
    .find({ userId: req.user!.id })
    .sort({ createdAt: -1 })
    .limit(30)
    .toArray();

  const ingestions = items.map(item => ({
    ...item,
    id: (item._id as ObjectId | undefined)?.toString()
  }));
  res.json({ ingestions });
});

router.post('/', async (req, res) => {
  const parsed = ingestionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  const now = new Date().toISOString();
  const collection = await getCollection<Record<string, unknown>>('ingestions');
  const doc = {
    userId: req.user!.id,
    status: 'processing',
    createdAt: now,
    updatedAt: now,
    ...parsed.data
  };

  const result = await collection.insertOne(doc);
  return res.status(201).json({
    id: result.insertedId.toString(),
    ...doc
  });
});

export default router;
