'use client';

import Image from 'next/image';
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
            <Link href="/register" className="text-blue-600 hover:text-blue-500">
              Create one
            </Link>
          </p>
          <Link href="/forgot-password" className="text-blue-600 hover:text-blue-500">
            Forgot password?
          </Link>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-700">
          Email address
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@enterprise.com"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </label>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <label className="inline-flex items-center gap-2 text-slate-600">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Remember me
          </label>
          <Link href="/change-password" className="text-blue-600 hover:text-blue-500">
            Change password
          </Link>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <button
          type="button"
          onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Image src="/google-icon.svg" alt="Google logo" width={18} height={18} />
          Continue with Google
        </button>
        {status && <p className="text-sm text-rose-600">{status}</p>}
      </form>
    </AuthCard>
  );
}
