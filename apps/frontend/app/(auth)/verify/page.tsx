'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReactNode, Suspense, useState } from 'react';
import { AuthCard } from '../../../components/AuthCard';
import { verifyAccount } from '../../../lib/api';

const cardCopy = {
  title: 'Verify your email',
  subtitle: 'Enter the 6-digit code we just sent you to finish activating your workspace.',
  footer: (
    <p>
      Already verified?{' '}
      <Link href="/login" className="text-blue-600 hover:text-blue-500">
        Sign in
      </Link>
    </p>
  )
};

function CardShell({ children }: { children: ReactNode }) {
  return (
    <AuthCard title={cardCopy.title} subtitle={cardCopy.subtitle} footer={cardCopy.footer}>
      {children}
    </AuthCard>
  );
}

function VerifyAccountContent() {
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
    <CardShell>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-700">
          Company email
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Verification code
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={event => setCode(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-lg font-semibold tracking-[0.4em] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-60"
        >
          {busy ? 'Verifying…' : 'Verify email'}
        </button>
        {status && <p className="text-sm text-rose-600">{status}</p>}
      </form>
    </CardShell>
  );
}

function VerifyFallback() {
  return (
    <CardShell>
      <p className="text-sm text-slate-300">Loading verification details…</p>
    </CardShell>
  );
}

export default function VerifyAccountPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyAccountContent />
    </Suspense>
  );
}
