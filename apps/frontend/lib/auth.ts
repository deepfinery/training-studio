import { AuthTokens } from './api';

export function persistTokens(tokens: AuthTokens) {
  if (typeof window === 'undefined') return;
  if (tokens.IdToken) localStorage.setItem('idToken', tokens.IdToken);
  if (tokens.AccessToken) localStorage.setItem('accessToken', tokens.AccessToken);
  if (tokens.RefreshToken) localStorage.setItem('refreshToken', tokens.RefreshToken);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('idToken');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export interface DecodedIdToken {
  sub?: string;
  email?: string;
  name?: string;
  exp?: number;
}

export function decodeIdToken(token?: string): DecodedIdToken | null {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const json = JSON.parse(atob(padded));
    return {
      sub: json.sub,
      email: json.email,
      name: json.name ?? json['cognito:username'],
      exp: typeof json.exp === 'number' ? json.exp : undefined
    };
  } catch {
    return null;
  }
}

export function currentUser(): DecodedIdToken | null {
  if (typeof window === 'undefined') return null;
  return decodeIdToken(getIdToken() ?? undefined);
}

export function getIdToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('idToken');
}

export function hasValidIdToken(): boolean {
  if (typeof window === 'undefined') return false;
  const token = getIdToken();
  const decoded = decodeIdToken(token ?? undefined);
  if (!token || !decoded) return false;
  if (decoded.exp && Date.now() >= decoded.exp * 1000) return false;
  return true;
}
