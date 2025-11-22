'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { quickActions } from '../lib/navigation';
import { BellRing, ChevronDown, LogOut, Search, Settings, User } from 'lucide-react';
import { clearTokens, currentUser } from '../lib/auth';

export function TopBar() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userLabel, setUserLabel] = useState('Authenticated');
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const info = currentUser();
    if (info?.name) setUserLabel(info.name);
    if (info?.email) setUserEmail(info.email);

    const listener = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, []);

  const handleLogout = () => {
    clearTokens();
    setMenuOpen(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0b1021]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-6 py-4">
        <div className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search datasets, jobs, or ontologies"
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          {quickActions.map(action => (
            <button
              key={action.title}
              className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-brand-400 hover:text-white lg:inline-flex"
            >
              <action.icon className="h-4 w-4" />
              {action.title}
            </button>
          ))}
          <Link
            href="/training"
            className="hidden rounded-2xl bg-brand-500/90 px-4 py-2 text-xs font-semibold text-white shadow-brand-500/30 transition hover:bg-brand-400 md:inline-flex"
          >
            Launch training
          </Link>
          <button className="rounded-full border border-white/10 p-2 text-slate-400 hover:text-white">
            <BellRing className="h-5 w-5" />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(open => !open)}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 transition hover:border-brand-400"
            >
              <div>
                <p className="text-xs text-slate-500">{userEmail ?? 'Logged in'}</p>
                <p className="text-sm font-semibold text-white">{userLabel}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700" />
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl shadow-black/40">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-200 hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
