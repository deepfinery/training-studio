'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthCard } from '../../../components/AuthCard';
import { getGoogleLoginUrl, login } from '../../../lib/api';
import { persistTokens } from '../../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const tokens = await login({ email, password });
      persistTokens(tokens);
      router.push('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in';
      if (message.toLowerCase().includes('confirm')) {
        setStatus('Please verify your email to sign in.');
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        setStatus(message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ?? `${window.location.origin}/sso/callback`;
      const url = await getGoogleLoginUrl(redirectUri);
      window.location.href = url;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to start SSO');
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to access your Training Studio workspace."
      footer={
        <div className="space-y-2">
          <p>
            Need an account?{' '}
            <Link href="/register" className="text-brand-200 hover:text-brand-100">
              Create one
            </Link>
          </p>
          <Link href="/forgot-password" className="text-brand-200 hover:text-brand-100">
            Forgot password?
          </Link>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="text-sm text-slate-300">
          Email address
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@enterprise.com"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
            required
          />
        </label>
        <label className="text-sm text-slate-300">
          Password
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
            required
          />
        </label>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent" />
            Remember me
          </label>
          <Link href="/change-password" className="text-brand-200 hover:text-brand-100">
            Change password
          </Link>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-brand-500/40 disabled:opacity-70"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full rounded-2xl border border-white/10 bg-slate-900/60 py-3 text-sm font-semibold text-slate-100 transition hover:border-brand-400"
        >
          Continue with Google SSO
        </button>
        {status && <p className="text-sm text-rose-200">{status}</p>}
      </form>
    </AuthCard>
  );
}
