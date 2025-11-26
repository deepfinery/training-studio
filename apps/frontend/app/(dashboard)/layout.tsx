'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { SidebarNav } from '../../components/SidebarNav';
import { TopBar } from '../../components/TopBar';
import { RequireAuth } from '../../components/RequireAuth';
import { ProjectProvider } from '../../components/ProjectProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RequireAuth>
      <ProjectProvider>
        <div className="flex min-h-screen bg-slate-900">
          <SidebarNav />
          <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
            <TopBar onMenuClick={() => setSidebarOpen(true)} />
            <div className="flex-1 overflow-y-auto px-4 pb-10 pt-6 sm:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
            </div>
          </div>
        </div>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            <div className="relative z-10 h-full w-72">
              <SidebarNav className="flex h-full flex-col border-r border-slate-800 bg-slate-950 px-6 py-8 text-sm text-slate-200" onNavigate={() => setSidebarOpen(false)} />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-900/80 text-slate-200 shadow-lg"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </ProjectProvider>
    </RequireAuth>
  );
}
