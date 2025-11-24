import { NextFunction, Request, Response } from 'express';
import { orgService } from '../services/orgService';

export async function withOrgContext(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const context = await orgService.resolveForUser(req.user);
    req.org = context.org;
    req.membership = context.membership;
    req.isGlobalAdmin = context.isGlobalAdmin;
    return next();
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to resolve workspace' });
  }
}

export function requireOrgAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.org || !req.membership) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.membership.role !== 'admin' && !req.isGlobalAdmin) {
    return res.status(403).json({ message: 'Admin privileges required' });
  }

  return next();
}
