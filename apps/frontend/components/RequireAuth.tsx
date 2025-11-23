'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { hasValidIdToken } from '../lib/auth';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasValidIdToken()) {
      const next = encodeURIComponent(pathname || '/');
      router.replace(`/login?next=${next}`);
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <p>Checking your session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
