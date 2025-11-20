import { Router } from 'express';
import { z } from 'zod';
import { trainingService } from '../services/trainingService';

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
  method: z.enum(['qlora', 'lora', 'full', 'new-transformer']),
  hyperparams: hyperparamsSchema,
  outputUri: z.string().optional()
});

router.get('/', (req, res) => {
  res.json({ jobs: trainingService.listJobs() });
});

router.get('/:jobId', (req, res) => {
  const job = trainingService.getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  res.json(job);
});

router.post('/', (req, res) => {
  const parseResult = createJobSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parseResult.error.flatten() });
  }

  const job = trainingService.createJob(parseResult.data);
  res.status(201).json(job);
});

router.post('/:jobId/status', (req, res) => {
  const schema = z.object({
    status: z.enum(['queued', 'running', 'succeeded', 'failed']),
    log: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  const updated = trainingService.updateJobStatus(req.params.jobId, parsed.data.status, parsed.data.log);
  if (!updated) {
    return res.status(404).json({ message: 'Job not found' });
  }

  res.json(updated);
});

export default router;
