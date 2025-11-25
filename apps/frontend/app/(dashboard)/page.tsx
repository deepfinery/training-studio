'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { fetchJobs, fetchOrgContext, TrainingJob } from '../../lib/api';
import { useProjects } from '../../components/ProjectProvider';
import { HistoryPanel } from '../../components/HistoryPanel';
import { TrainingJobsTable } from '../../components/TrainingJobsTable';

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{helper}</p>
    </article>
  );
}

export default function DashboardPage() {
  const { projects, activeProject, isLoading: projectsLoading } = useProjects();
  const { data: jobs } = useSWR<TrainingJob[]>('jobs', fetchJobs, { refreshInterval: 8000 });
  const { data: orgContext } = useSWR('org-context', fetchOrgContext);

  const runningJobs = jobs?.filter(job => job.status === 'running').length ?? 0;
  const queuedJobs = jobs?.filter(job => job.status === 'queued').length ?? 0;
  const freeJobsConsumed = orgContext?.org?.freeJobsConsumed ?? 0;
  const freeRemaining = Math.max(0, 100 - freeJobsConsumed);

  const stats = [
    {
      label: 'Projects',
      value: projects.length.toString(),
      helper: projectsLoading ? 'Loading…' : `${projects.length} total`
    },
    {
      label: 'Active project',
      value: activeProject?.name ?? 'None',
      helper: activeProject ? 'In focus' : 'Select a project'
    },
    {
      label: 'Running jobs',
      value: runningJobs.toString(),
      helper: `${queuedJobs} queued`
    },
    {
      label: 'Promo credits',
      value: (orgContext?.org?.promoCredits ?? 0).toLocaleString(),
      helper: `${freeRemaining} free jobs remaining`
    }
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Workspace</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Operational overview</h1>
            <p className="text-slate-500">Monitor projects, jobs, and billing at a glance. Jump into datasets or the training hub when you&apos;re ready.</p>
          </div>
          <Link
            href="/projects"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
          >
            Manage projects
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} helper={stat.helper} />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrainingJobsTable
          limit={5}
          allowActions={false}
          title="Recent training jobs"
          description="Latest activity across the workspace"
        />
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Quick links</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link className="text-blue-600" href="/training">
                Launch a new training job
              </Link>
            </li>
            <li>
              <Link className="text-blue-600" href="/data">
                Upload datasets
              </Link>
            </li>
            <li>
              <Link className="text-blue-600" href="/billing">
                Update billing & credits
              </Link>
            </li>
          </ul>
          <p className="mt-4 text-xs text-slate-500">Need to deploy a model? Visit the Serve & Reinforce tab to ship to EKS or edge clusters.</p>
        </section>
      </div>

      <HistoryPanel />
    </div>
  );
}
