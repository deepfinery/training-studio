import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authMiddleware';
import { requireOrgAdmin, withOrgContext } from '../middleware/orgMiddleware';
import { clusterService } from '../services/clusterService';
import { Cluster } from '../types/cluster';

const router = Router();

const clusterInputSchema = z.object({
  name: z.string().min(3),
  provider: z.enum(['huggingface', 'meta', 'nemo']),
  apiBaseUrl: z.string().url(),
  apiToken: z.string().min(8),
  authHeaderName: z.string().min(3).max(60).optional(),
  gpuType: z.string().optional(),
  region: z.string().optional(),
  s3AccessKeyId: z.string().optional(),
  s3SecretAccessKey: z.string().optional(),
  s3SessionToken: z.string().optional(),
  s3Region: z.string().optional()
});

function redactCluster(cluster: Cluster) {
  const { metadata, ...rest } = cluster;
  const safeMetadata = metadata
    ? {
        gpuType: metadata.gpuType,
        region: metadata.region,
        authHeaderName: metadata.authHeaderName,
        s3Region: metadata.s3Region,
        hasS3Credentials: Boolean(metadata.s3AccessKeyId && metadata.s3SecretAccessKey)
      }
    : undefined;
  return {
    ...rest,
    apiToken: undefined,
    metadata: safeMetadata
  };
}

router.use(requireAuth, withOrgContext);

router.get('/', async (req, res) => {
  const clusters = await clusterService.list(req.org!.id);
  res.json({
    clusters: clusters.map(redactCluster)
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
        region: parsed.data.region,
        authHeaderName: parsed.data.authHeaderName,
        s3AccessKeyId: parsed.data.s3AccessKeyId,
        s3SecretAccessKey: parsed.data.s3SecretAccessKey,
        s3SessionToken: parsed.data.s3SessionToken,
        s3Region: parsed.data.s3Region
      }
    });

    res.status(201).json({ cluster: redactCluster(cluster) });
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
      parsed.data.gpuType ||
      parsed.data.region ||
      parsed.data.authHeaderName ||
      parsed.data.s3AccessKeyId ||
      parsed.data.s3SecretAccessKey ||
      parsed.data.s3SessionToken ||
      parsed.data.s3Region
        ? {
            gpuType: parsed.data.gpuType,
            region: parsed.data.region,
            authHeaderName: parsed.data.authHeaderName,
            s3AccessKeyId: parsed.data.s3AccessKeyId,
            s3SecretAccessKey: parsed.data.s3SecretAccessKey,
            s3SessionToken: parsed.data.s3SessionToken,
            s3Region: parsed.data.s3Region
          }
        : undefined;
    const cluster = await clusterService.update(req.org!.id, req.params.clusterId, {
      name: parsed.data.name,
      provider: parsed.data.provider,
      apiBaseUrl: parsed.data.apiBaseUrl,
      apiToken: parsed.data.apiToken,
      metadata
    });
    res.json({ cluster: redactCluster(cluster) });
  } catch (error) {
    res.status(404).json({ message: error instanceof Error ? error.message : 'Cluster not found' });
  }
});

router.delete('/:clusterId', requireOrgAdmin, async (req, res) => {
  try {
    await clusterService.remove(req.org!.id, req.params.clusterId);
    res.status(204).end();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete cluster';
    res.status(message.includes('locked') ? 403 : 404).json({ message });
  }
});

export default router;
