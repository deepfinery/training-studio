import { Router } from 'express';
import { z } from 'zod';
import { exchangeAuthCode, googleSsoUrl, loginUser, registerUser, verifyUser, changePassword } from '../services/cognitoService';

const router = Router();

router.post('/register', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const response = await registerUser(parsed.data.email, parsed.data.password, parsed.data.name);
    res.status(201).json({
      userSub: response.UserSub,
      userConfirmed: response.UserConfirmed
    });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to register user' });
  }
});

router.post('/login', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const result = await loginUser(parsed.data.email, parsed.data.password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error instanceof Error ? error.message : 'Failed to authenticate' });
  }
});

router.post('/verify', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    code: z.string().min(4).max(12)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    await verifyUser(parsed.data.email, parsed.data.code);
    res.json({ verified: true });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to verify account' });
  }
});

router.post('/change-password', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    await changePassword(parsed.data.email, parsed.data.currentPassword, parsed.data.newPassword);
    res.json({ updated: true });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to change password' });
  }
});

router.get('/google', (req, res) => {
  try {
    const url = googleSsoUrl(typeof req.query.redirectUri === 'string' ? req.query.redirectUri : undefined);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to create Google SSO link' });
  }
});

router.post('/exchange', async (req, res) => {
  const schema = z.object({
    code: z.string().min(5),
    redirectUri: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const tokens = await exchangeAuthCode(parsed.data.code, parsed.data.redirectUri);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ message: error instanceof Error ? error.message : 'Unable to exchange authorization code' });
  }
});

export default router;
