import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authMiddleware';
import { requireOrgAdmin, withOrgContext } from '../middleware/orgMiddleware';
import { clusterService } from '../services/clusterService';

const router = Router();

const clusterInputSchema = z.object({
  name: z.string().min(3),
  provider: z.enum(['huggingface', 'meta', 'nemo']),
  apiBaseUrl: z.string().url(),
  apiToken: z.string().min(8),
  gpuType: z.string().optional(),
  region: z.string().optional()
});

router.use(requireAuth, withOrgContext);

router.get('/', async (req, res) => {
  const clusters = await clusterService.list(req.org!.id);
  res.json({
    clusters: clusters.map(cluster => ({
      ...cluster,
      apiToken: undefined
    }))
  });
});

router.post('/', requireOrgAdmin, async (req, res) => {
  const parsed = clusterInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const cluster = await clusterService.create(req.org!.id, {
      name: parsed.data.name,
      provider: parsed.data.provider,
      apiBaseUrl: parsed.data.apiBaseUrl,
      apiToken: parsed.data.apiToken,
      requiresPayment: false,
      kind: 'customer',
      ownedBy: 'customer',
      freeJobLimit: undefined,
      metadata: {
        gpuType: parsed.data.gpuType,
        region: parsed.data.region
      }
    });

    res.status(201).json({ cluster: { ...cluster, apiToken: undefined } });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to create cluster' });
  }
});

router.put('/:clusterId', requireOrgAdmin, async (req, res) => {
  const parsed = clusterInputSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const metadata =
      parsed.data.gpuType || parsed.data.region
        ? {
            gpuType: parsed.data.gpuType,
            region: parsed.data.region
          }
        : undefined;
    const cluster = await clusterService.update(req.org!.id, req.params.clusterId, {
      name: parsed.data.name,
      provider: parsed.data.provider,
      apiBaseUrl: parsed.data.apiBaseUrl,
      apiToken: parsed.data.apiToken,
      metadata
    });
    res.json({ cluster: { ...cluster, apiToken: undefined } });
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Cluster not found' });
  }
});

export default router;
