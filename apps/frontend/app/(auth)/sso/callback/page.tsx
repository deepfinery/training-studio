'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCode } from '../../../../lib/api';
import { persistTokens } from '../../../../lib/auth';

function StatusPanel({ status }: { status: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-8 py-6 text-center shadow-xl shadow-black/40">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-200">SSO</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Completing login</h1>
        <p className="mt-3 text-sm text-slate-300">{status}</p>
      </div>
    </div>
  );
}

function SsoCallbackContent() {
  const search = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('Finalizing sign-in...');

  useEffect(() => {
    const code = search.get('code');
    if (!code) {
      setStatus('Missing authorization code');
      return;
    }

    const run = async () => {
      try {
        const tokens = await exchangeCode(code, process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI);
        persistTokens(tokens);
        setStatus('Authenticated. Redirecting…');
        router.push('/');
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to finish login');
      }
    };

    run();
  }, [router, search]);

  return <StatusPanel status={status} />;
}

export default function SsoCallbackPage() {
  return (
    <Suspense fallback={<StatusPanel status="Preparing login..." />}>
      <SsoCallbackContent />
    </Suspense>
  );
}
