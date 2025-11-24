import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authMiddleware';
import { requireOrgAdmin, withOrgContext } from '../middleware/orgMiddleware';
import { clusterService } from '../services/clusterService';
import { orgService } from '../services/orgService';

const router = Router();

router.use(requireAuth, withOrgContext);

router.get('/context', (req, res) => {
  res.json({
    org: req.org,
    membership: req.membership,
    isGlobalAdmin: req.isGlobalAdmin ?? false
  });
});

router.put('/default-cluster', requireOrgAdmin, async (req, res) => {
  const schema = z.object({ clusterId: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  const cluster = await clusterService.get(req.org!.id, parsed.data.clusterId);
  if (!cluster) {
    return res.status(404).json({ message: 'Cluster not found' });
  }

  const updatedOrg = await orgService.updateOrg(req.org!.id, { defaultClusterId: cluster.id });
  res.json({ org: updatedOrg });
});

export default router;
