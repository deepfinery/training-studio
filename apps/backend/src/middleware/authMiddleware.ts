import { NextFunction, Request, Response } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from '../config/env';
import { AuthenticatedUser } from '../types/auth';

const hasCognitoConfig = Boolean(env.COGNITO_USER_POOL_ID && env.COGNITO_CLIENT_ID);
const verifier = hasCognitoConfig
  ? CognitoJwtVerifier.create({
      userPoolId: env.COGNITO_USER_POOL_ID,
      tokenUse: 'id',
      clientId: env.COGNITO_CLIENT_ID
    })
  : null;

function fallbackUser(): AuthenticatedUser {
  return {
    id: 'demo-user',
    email: 'demo@deepfinery.ai',
    name: 'Demo User'
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    if (env.ALLOW_DEV_AUTH) {
      req.user = fallbackUser();
      return next();
    }
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  const token = header.replace(/^Bearer\s+/i, '').trim();

  if (!verifier) {
    if (env.ALLOW_DEV_AUTH) {
      req.user = fallbackUser();
      return next();
    }
    return res.status(500).json({ message: 'Cognito is not configured' });
  }

  try {
    const payload = await verifier.verify(token);
    req.user = {
      id: payload.sub,
      email: (payload as Record<string, string>).email,
      name: (payload as Record<string, string>).name ?? (payload as Record<string, string>)['cognito:username'],
      groups: (payload as Record<string, string[]>['cognito:groups']) ?? []
    };
    return next();
  } catch (error) {
    if (env.ALLOW_DEV_AUTH) {
      req.user = fallbackUser();
      return next();
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
