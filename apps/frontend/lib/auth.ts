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
}

export function decodeIdToken(token?: string): DecodedIdToken | null {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    const json = JSON.parse(atob(payload));
    return {
      sub: json.sub,
      email: json.email,
      name: json.name ?? json['cognito:username']
    };
  } catch {
    return null;
  }
}

export function currentUser(): DecodedIdToken | null {
  if (typeof window === 'undefined') return null;
  return decodeIdToken(localStorage.getItem('idToken') ?? undefined);
}
