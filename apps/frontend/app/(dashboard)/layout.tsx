import { SidebarNav } from '../../components/SidebarNav';
import { TopBar } from '../../components/TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050811]">
      <SidebarNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="flex-1 overflow-y-auto px-6 pb-10 pt-4">
          <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
