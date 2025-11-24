import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authMiddleware';
import { requireOrgAdmin, withOrgContext } from '../middleware/orgMiddleware';
import { billingService } from '../services/billingService';

const router = Router();

router.use(requireAuth, withOrgContext);

router.get('/overview', async (req, res) => {
  try {
    const overview = await billingService.getOverview(req.org!);
    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to load billing overview' });
  }
});

router.post('/setup-intent', requireOrgAdmin, async (req, res) => {
  try {
    const intent = await billingService.createSetupIntent(req.org!);
    res.json(intent);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to create setup intent' });
  }
});

router.post('/attach', requireOrgAdmin, async (req, res) => {
  const schema = z.object({
    paymentMethodId: z.string().min(5),
    makeDefault: z.boolean().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    await billingService.attachPaymentMethod(req.org!, parsed.data.paymentMethodId, parsed.data.makeDefault ?? true);
    const overview = await billingService.getOverview(req.org!);
    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to attach payment method' });
  }
});

router.post('/default', requireOrgAdmin, async (req, res) => {
  const schema = z.object({ paymentMethodId: z.string().min(5) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    await billingService.setDefaultPaymentMethod(req.org!, parsed.data.paymentMethodId);
    const overview = await billingService.getOverview(req.org!);
    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to set default payment method' });
  }
});

router.delete('/payment-methods/:id', requireOrgAdmin, async (req, res) => {
  try {
    await billingService.removePaymentMethod(req.org!, req.params.id);
    const overview = await billingService.getOverview(req.org!);
    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to delete payment method' });
  }
});

router.put('/address', requireOrgAdmin, async (req, res) => {
  const schema = z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    await billingService.updateBillingAddress(req.org!, parsed.data);
    const overview = await billingService.getOverview(req.org!);
    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to update billing address' });
  }
});

router.post('/promo', requireOrgAdmin, async (req, res) => {
  const schema = z.object({ code: z.string().min(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const org = await billingService.applyPromoCode(req.org!, parsed.data.code);
    res.json({ promoCredits: org.promoCredits });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to apply promo code' });
  }
});

export default router;
