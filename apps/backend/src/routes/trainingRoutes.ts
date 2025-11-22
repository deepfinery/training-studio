import { Router } from 'express';
import { z } from 'zod';
import { trainingService } from '../services/trainingService';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

const hyperparamsSchema = z.object({
  baseModel: z.string(),
  sequenceLength: z.number().int().positive().max(8192),
  batchSize: z.number().int().positive(),
  gradientAccumulation: z.number().int().positive(),
  epochs: z.number().int().positive(),
  learningRate: z.number().positive(),
  rank: z.number().int().positive().optional(),
  alpha: z.number().positive().optional(),
  dropout: z.number().min(0).max(1).optional(),
  packing: z.boolean().optional()
});

const createJobSchema = z.object({
  datasetUri: z.string().url().or(z.string().startsWith('s3://')).or(z.string().startsWith('gs://')),
  datasetKey: z.string().optional(),
  method: z.enum(['qlora', 'lora', 'full', 'new-transformer']),
  hyperparams: hyperparamsSchema,
  outputUri: z.string().optional(),
  outputBucket: z.string().optional(),
  name: z.string().optional()
});

router.get('/', requireAuth, async (req, res) => {
  res.json({ jobs: await trainingService.listJobs(req.user!.id) });
});

router.get('/:jobId', requireAuth, async (req, res) => {
  const job = await trainingService.getJob(req.user!.id, req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  res.json(job);
});

router.post('/', requireAuth, async (req, res) => {
  const parseResult = createJobSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parseResult.error.flatten() });
  }

  const job = await trainingService.createJob(req.user!.id, parseResult.data);
  res.status(201).json(job);
});

router.post('/:jobId/status', requireAuth, async (req, res) => {
  const schema = z.object({
    status: z.enum(['queued', 'running', 'succeeded', 'failed']),
    log: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  const updated = await trainingService.updateJobStatus(req.user!.id, req.params.jobId, parsed.data.status, parsed.data.log);
  if (!updated) {
    return res.status(404).json({ message: 'Job not found' });
  }

  res.json(updated);
});

export default router;
