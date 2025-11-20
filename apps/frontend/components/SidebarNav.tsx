'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { primaryNav } from '../lib/navigation';

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-white/5 bg-slate-950/80 px-6 py-8 text-sm text-slate-300 lg:flex">
      <div className="mb-10 space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-brand-200">DeepFinery</p>
        <p className="text-2xl font-semibold text-white">Training Studio</p>
        <p className="text-xs text-slate-500">Operationalize deterministic SLMs</p>
      </div>
      <nav className="space-y-8">
        {primaryNav.map(section => (
          <div key={section.title} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{section.title}</p>
            <div className="space-y-1">
              {section.items.map(item => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={clsx(
                      'flex items-center justify-between rounded-2xl px-4 py-3 transition hover:text-white',
                      active ? 'bg-brand-500/10 text-white' : 'text-slate-400 hover:bg-white/5'
                    )}
                  >
                    <span className="inline-flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-brand-100">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-auto space-y-3 rounded-3xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Support</p>
        <p className="text-sm text-slate-300">Need a custom deployment? Our architects can help you size GPUs, EKS clusters, and SLAs.</p>
        <Link href="/billing" className="inline-flex items-center justify-center rounded-2xl bg-brand-500/20 px-4 py-2 text-xs font-semibold text-brand-50">
          Contact sales
        </Link>
      </div>
    </aside>
  );
}
