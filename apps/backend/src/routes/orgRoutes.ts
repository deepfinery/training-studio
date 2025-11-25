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

router.put('/profile', requireOrgAdmin, async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(120).optional(),
    slug: z
      .string()
      .min(3)
      .max(64)
      .regex(/^[a-z0-9-]+$/i)
      .optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const updated = await orgService.updateProfile(req.org!.id, parsed.data);
    res.json({ org: updated });
  } catch (error) {
    const status = error instanceof Error && error.message === 'Slug already in use' ? 409 : 500;
    res.status(status).json({ message: error instanceof Error ? error.message : 'Unable to update organization' });
  }
});

router.get('/members', requireOrgAdmin, async (req, res) => {
  try {
    const members = await orgService.listMembers(req.org!.id);
    res.json({ members });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to load members' });
  }
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
