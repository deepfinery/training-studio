import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authMiddleware';
import { withOrgContext } from '../middleware/orgMiddleware';
import { billingService } from '../services/billingService';
import { clusterService } from '../services/clusterService';
import { trainingService } from '../services/trainingService';

const router = Router();

const trainerSpecSchema = z.object({
  jobId: z.string().optional(),
  baseModel: z.object({
    provider: z.enum(['huggingface', 'meta', 'nemo']),
    modelName: z.string(),
    revision: z.string().optional(),
    authToken: z.string().optional(),
    weightsUrl: z.string().optional().or(z.null())
  }),
  customization: z.object({
    method: z.string(),
    rank: z.number().int().positive().optional(),
    targetModules: z.array(z.string()).optional(),
    loraAlpha: z.number().optional(),
    loraDropout: z.number().optional(),
    trainableLayers: z.array(z.string()).optional(),
    precision: z.string().optional(),
    qlora: z.record(z.any()).optional(),
    peft: z
      .object({
        use: z.boolean(),
        config: z.record(z.any()).optional()
      })
      .optional()
  }),
  resources: z.object({
    gpus: z.number().int().positive(),
    gpuType: z.string().optional(),
    cpus: z.number().int().optional(),
    memoryGb: z.number().int().optional(),
    maxDurationMinutes: z.number().int().optional()
  }),
  datasets: z
    .array(
      z.object({
        source: z.string().min(1),
        format: z.string().min(1),
        auth: z.record(z.string(), z.string()).optional()
      })
    )
    .min(1),
  artifacts: z.object({
    logUri: z.string().optional(),
    statusStreamUrl: z.string().optional(),
    outputUri: z.string().optional()
  }),
  tuningParameters: z.record(z.any()).optional(),
  callbacks: z
    .object({
      webhookUrl: z.string().optional(),
      authHeader: z.string().optional()
    })
    .optional()
});

const createJobSchema = z.object({
  name: z.string().optional(),
  clusterId: z.string().min(1),
  spec: trainerSpecSchema
});

router.use(requireAuth, withOrgContext);

router.get('/', async (req, res) => {
  const jobs = await trainingService.listJobs(req.org!.id, req.user!.id, req.membership!.role, req.isGlobalAdmin ?? false);
  res.json({ jobs });
});

router.get('/:jobId', async (req, res) => {
  const job = await trainingService.getJob(req.org!.id, req.params.jobId, req.user!.id, req.membership!.role, req.isGlobalAdmin ?? false);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  res.json(job);
});

router.post('/', async (req, res) => {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  const cluster = await clusterService.get(req.org!.id, parsed.data.clusterId);
  if (!cluster) {
    return res.status(404).json({ message: 'Cluster not found' });
  }

  let jobId: string | undefined;
  try {
    const plan = await billingService.planJobCharge(req.org!, cluster);
    const job = await trainingService.createJob({
      orgId: req.org!.id,
      userId: req.user!.id,
      request: parsed.data,
      cluster
    });
    jobId = job.id;
    await trainingService.dispatchToCluster(job, cluster);
    const billing = await billingService.commitJobCharge(req.org!, job, plan);
    const updated = await trainingService.attachBilling(job.id, billing);
    res.status(201).json(updated ?? job);
  } catch (error) {
    if (jobId) {
      await trainingService.markJobFailed(jobId, error instanceof Error ? error.message : 'Dispatch failed');
    }
    res.status(502).json({ message: error instanceof Error ? error.message : 'Unable to start job' });
  }
});

router.post('/:jobId/status', async (req, res) => {
  const schema = z.object({
    status: z.enum(['queued', 'running', 'succeeded', 'failed']),
    log: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  const updated = await trainingService.updateJobStatusForOrg(
    req.org!.id,
    req.params.jobId,
    req.user!.id,
    req.membership!.role,
    req.isGlobalAdmin ?? false,
    parsed.data.status,
    parsed.data.log
  );
  if (!updated) {
    return res.status(404).json({ message: 'Job not found' });
  }

  res.json(updated);
});

export default router;

export const trainingWebhookRouter = Router();

trainingWebhookRouter.post('/webhooks/:jobId', async (req, res) => {
  const schema = z.object({
    status: z.enum(['queued', 'running', 'succeeded', 'failed']),
    log: z.string().optional()
  });

  const tokenHeader = req.headers['x-cluster-token'] ?? req.headers.authorization;
  const tokenValue = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
  if (!tokenValue) {
    return res.status(401).json({ message: 'Missing cluster token' });
  }
  const token = tokenValue.replace(/^Bearer\s+/i, '').trim();

  const job = await trainingService.findJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  const cluster = await clusterService.findById(job.clusterId);
  if (!cluster || !cluster.apiToken || cluster.apiToken !== token) {
    return res.status(403).json({ message: 'Invalid cluster token' });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  const updated = await trainingService.updateJobStatusFromCluster(job.id, parsed.data.status, parsed.data.log);
  res.json(updated);
});
