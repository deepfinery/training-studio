'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AuthCard } from '../../../components/AuthCard';
import { verifyAccount } from '../../../lib/api';

export default function VerifyAccountPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await verifyAccount({ email, code });
      setStatus('Email verified! Redirecting to sign in…');
      setTimeout(() => router.push('/login'), 1200);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to verify email');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Verify your email"
      subtitle="Enter the 6-digit code we just sent you to finish activating your workspace."
      footer={
        <p>
          Already verified?{' '}
          <Link href="/login" className="text-brand-200 hover:text-brand-100">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
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
          Verification code
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={event => setCode(event.target.value)}
            className="mt-1 tracking-[0.4em] w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-center text-lg font-semibold text-white"
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-70"
        >
          {busy ? 'Verifying…' : 'Verify email'}
        </button>
        {status && <p className="text-sm text-rose-200">{status}</p>}
      </form>
    </AuthCard>
  );
}
