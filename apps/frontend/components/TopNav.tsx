'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/workflows', label: 'Workflows' },
  { href: '/deploy', label: 'Serve & Reinforce' }
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-white/10 backdrop-blur-sm sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-sm text-slate-200">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-200">DeepFinery</p>
          <p className="text-lg font-semibold text-white">Training Studio</p>
        </div>
        <nav className="flex gap-6">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx('transition-colors hover:text-white', {
                'text-brand-200': pathname === link.href,
                'text-slate-400': pathname !== link.href
              })}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <p className="text-white">R&D plan</p>
            <p className="text-slate-400">Enterprise tier</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-brand-400/30" />
        </div>
      </div>
    </header>
  );
}
