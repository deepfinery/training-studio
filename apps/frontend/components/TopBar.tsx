'use client';

import { useState } from 'react';
import Link from 'next/link';
import { quickActions } from '../lib/navigation';
import { BellRing, ChevronDown, Search } from 'lucide-react';

export function TopBar() {
  const [query, setQuery] = useState('');

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-6 py-4">
        <div className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search datasets, jobs, or ontologies"
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          {quickActions.map(action => (
            <button
              key={action.title}
              className="hidden items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-brand-400 hover:text-white lg:inline-flex"
            >
              <action.icon className="h-4 w-4" />
              {action.title}
            </button>
          ))}
          <Link
            href="/training"
            className="hidden rounded-2xl bg-brand-500/80 px-4 py-2 text-xs font-semibold text-white shadow-brand-500/40 transition hover:bg-brand-400/90 md:inline-flex"
          >
            Launch training
          </Link>
          <button className="rounded-full border border-white/10 p-2 text-slate-400 hover:text-white">
            <BellRing className="h-5 w-5" />
          </button>
          <Link href="/profile" className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2">
            <div>
              <p className="text-xs text-slate-500">Logged in as</p>
              <p className="text-sm font-semibold text-white">Alex Product</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600" />
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </Link>
        </div>
      </div>
    </header>
  );
}
