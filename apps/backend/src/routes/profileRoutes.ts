import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authMiddleware';
import { withOrgContext } from '../middleware/orgMiddleware';
import { profileService } from '../services/profileService';

const router = Router();

const profileSchema = z.object({
  name: z.string().max(120).optional(),
  role: z.string().max(120).optional(),
  company: z.string().max(120).optional(),
  phone: z.string().max(64).optional()
});

router.get('/', requireAuth, withOrgContext, async (req, res) => {
  const email = req.user?.email ?? `${req.user?.id ?? 'user'}@local`;
  const profile = await profileService.getProfile(req.user!.id, { email, name: req.user?.name });
  res.json({ profile, role: req.membership?.role ?? 'standard' });
});

router.put('/', requireAuth, withOrgContext, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  const email = req.user?.email ?? `${req.user?.id ?? 'user'}@local`;
  const profile = await profileService.updateProfile(req.user!.id, email, parsed.data);
  res.json({ profile });
});

export default router;
