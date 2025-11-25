'use client';

import { SidebarNav } from '../../components/SidebarNav';
import { TopBar } from '../../components/TopBar';
import { RequireAuth } from '../../components/RequireAuth';
import { ProjectProvider } from '../../components/ProjectProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <ProjectProvider>
        <div className="flex min-h-screen bg-slate-900">
          <SidebarNav />
          <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
            <TopBar />
            <div className="flex-1 overflow-y-auto px-8 pb-10 pt-6">
              <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
            </div>
          </div>
        </div>
      </ProjectProvider>
    </RequireAuth>
  );
}
