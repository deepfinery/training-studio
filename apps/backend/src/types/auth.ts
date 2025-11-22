export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
  groups?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
