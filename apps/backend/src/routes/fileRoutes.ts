import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authMiddleware';
import { completeUpload, createPresignedUpload, listFiles } from '../services/storageService';

const router = Router();

router.use(requireAuth);

router.post('/presign', async (req, res) => {
  const schema = z.object({
    fileName: z.string().min(1),
    contentType: z.string().optional(),
    kind: z.enum(['ingestion', 'training-input', 'training-output', 'evaluation']),
    jobId: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const presign = await createPresignedUpload(req.user!.id, parsed.data);
    res.status(201).json(presign);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to create upload URL' });
  }
});

router.post('/complete', async (req, res) => {
  const schema = z.object({
    key: z.string().min(1),
    size: z.number().int().optional(),
    contentType: z.string().optional(),
    jobId: z.string().optional(),
    checksum: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const record = await completeUpload(req.user!.id, parsed.data.key, parsed.data);
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to record upload' });
  }
});

router.get('/', async (req, res) => {
  const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined;
  try {
    const files = await listFiles(req.user!.id, kind as any);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to list files' });
  }
});

export default router;
