'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { navTree, NavNode } from '../lib/navigation';

interface NavBranchProps {
  node: NavNode;
  depth: number;
  activePath: string;
  onNavigate?: () => void;
}

function NavBranch({ node, depth, activePath, onNavigate }: NavBranchProps) {
  if (!node.children || node.children.length === 0) {
    if (!node.href) return null;
    const normalizedHref = node.href.split('#')[0];
    const active = activePath === normalizedHref;
    return (
      <Link
        key={node.href}
        href={node.href}
        onClick={onNavigate}
        className={clsx(
          'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition',
          active ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
          depth > 1 && 'ml-4'
        )}
        aria-current={active ? 'page' : undefined}
      >
        <span className="inline-flex items-center gap-3">
          {node.icon && <node.icon className="h-4 w-4" />}
          {node.title}
        </span>
        {node.badge && (
          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-blue-100">
            {node.badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <div key={node.title} className="space-y-2">
      {depth === 0 && <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{node.title}</p>}
      <div className="space-y-1">
        {node.children.map(child => (
          <NavBranch key={child.title} node={child} depth={depth + 1} activePath={activePath} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

interface SidebarNavProps {
  className?: string;
  onNavigate?: () => void;
}

export function SidebarNav({ className, onNavigate }: SidebarNavProps = {}) {
  const pathname = usePathname() ?? '';
  const activePath = pathname.split('#')[0];

  const baseClasses =
    'w-72 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-950 px-6 py-8 text-sm text-slate-200';

  return (
    <aside className={clsx(baseClasses, className ?? 'hidden lg:flex')}>
      <div className="mb-8 space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-blue-200">DeepFinery</p>
        <p className="text-2xl font-semibold text-white">Training Studio</p>
        <p className="text-xs text-slate-500">Operationalize deterministic SLMs</p>
      </div>
      <nav className="space-y-6">
        {navTree.map(section => (
          <NavBranch key={section.title} node={section} depth={0} activePath={activePath} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="mt-auto space-y-3 rounded-lg border border-white/10 bg-slate-900/70 p-4 text-xs text-slate-300">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Support</p>
        <p className="text-sm text-slate-300">
          Need a custom deployment? Our architects can help you size GPUs, EKS clusters, and SLAs.
        </p>
        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          New project
        </Link>
      </div>
    </aside>
  );
}
