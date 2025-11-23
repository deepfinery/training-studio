'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthCard } from '../../../components/AuthCard';
import { login, registerAccount } from '../../../lib/api';
import { persistTokens } from '../../../lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setStatus('Passwords do not match');
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const result = await registerAccount({ email, password, name });
      if (result.userConfirmed === false) {
        setStatus('Account created. Check your inbox for the verification code.');
        router.push(`/verify?email=${encodeURIComponent(email)}`);
        return;
      }
      const tokens = await login({ email, password });
      persistTokens(tokens);
      setStatus('Workspace created. Redirecting…');
      router.push('/');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to create account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Create workspace"
      subtitle="Spin up a DeepFinery Training Studio tenant in minutes."
      footer={
        <p>
          Already onboarded?{' '}
          <Link href="/login" className="text-brand-200 hover:text-brand-100">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="text-sm text-slate-300">
          Full name
          <input
            type="text"
            value={name}
            onChange={event => setName(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
            required
          />
        </label>
        <label className="text-sm text-slate-300">
          Company email
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
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
        <label className="text-sm text-slate-300">
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-brand-500/40 disabled:opacity-70"
        >
          {busy ? 'Creating…' : 'Create workspace'}
        </button>
        {status && <p className="text-sm text-rose-200">{status}</p>}
      </form>
    </AuthCard>
  );
}
