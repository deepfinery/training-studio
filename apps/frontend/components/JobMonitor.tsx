'use client';

import useSWR from 'swr';
import { fetchJobs, TrainingJob } from '../lib/api';

const statusColors: Record<TrainingJob['status'], string> = {
  queued: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30',
  running: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
  succeeded: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  failed: 'text-rose-300 bg-rose-500/10 border-rose-500/30'
};

export function JobMonitor() {
  const { data, error, isLoading, mutate } = useSWR('jobs', fetchJobs, { refreshInterval: 7500 });

  return (
    <section className="gradient-card col-span-12 flex flex-col gap-4 rounded-3xl px-6 py-6 md:col-span-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-brand-200">Monitor</p>
          <h2 className="text-2xl font-semibold text-white">Live jobs</h2>
        </div>
        <button onClick={() => mutate()} className="text-xs text-slate-400 hover:text-white">Refresh</button>
      </div>
      {isLoading && <p className="text-sm text-slate-400">Loading jobs…</p>}
      {error && <p className="text-sm text-rose-300">Failed to load jobs</p>}
      <div className="flex flex-col gap-3">
        {(data ?? []).map(job => (
          <article key={job.id} className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">{job.jobSpec.baseModel.modelName}</p>
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusColors[job.status]}`}>
                {job.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {job.method.toUpperCase()} · {job.datasetUri}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Cluster: <span className="font-mono text-brand-200">{job.clusterName}</span> ({job.clusterKind})
            </p>
            {job.billing && (
              <p className="text-xs text-slate-500">
                Billed via {job.billing.source.replace(/-/g, ' ')} · {job.billing.amountUsd ? `$${job.billing.amountUsd.toFixed(2)}` : '0$'}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">Updated {new Date(job.updatedAt).toLocaleTimeString()}</p>
            {job.logs && (
              <ul className="mt-3 space-y-1 text-xs text-slate-300">
                {job.logs.slice(-3).map((log, index) => (
                  <li key={`${job.id}-log-${index}`}>{log}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
        {!isLoading && data?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
            No jobs yet. Launch one from the left pane.
          </div>
        )}
      </div>
    </section>
  );
}
