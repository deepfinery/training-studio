'use client';

import useSWR from 'swr';
import { Clock3, FolderOpen, Gauge } from 'lucide-react';
import { EvaluationRecord, FileRecord, fetchHistory, TrainingJob } from '../lib/api';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-3xl border border-white/5 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{title}</p>
      {children}
    </article>
  );
}

export function HistoryPanel() {
  const { data, error, isLoading, mutate } = useSWR('history', fetchHistory, { refreshInterval: 12000 });

  const jobs: TrainingJob[] = data?.jobs ?? [];
  const files: FileRecord[] = data?.files ?? [];
  const evaluations: EvaluationRecord[] = data?.evaluations ?? [];

  return (
    <section className="glass-panel rounded-3xl border border-white/5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-brand-200">History</p>
          <h3 className="text-2xl font-semibold text-white">Previous jobs & assets</h3>
        </div>
        <button onClick={() => mutate()} className="text-xs text-slate-400 hover:text-white">
          Refresh
        </button>
      </div>
      {isLoading && <p className="mt-3 text-sm text-slate-400">Loading history…</p>}
      {error && <p className="mt-3 text-sm text-rose-300">Unable to load history</p>}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <SectionCard title="Training jobs">
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {jobs.slice(0, 4).map(job => (
              <li key={job.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 px-3 py-2">
                <span className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-brand-300" />
                  {job.name ?? job.hyperparams.baseModel ?? job.id}
                </span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-300">
                  {job.status}
                </span>
              </li>
            ))}
            {!isLoading && jobs.length === 0 && <li className="text-xs text-slate-500">No jobs yet.</li>}
          </ul>
        </SectionCard>

        <SectionCard title="Files">
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {files.slice(0, 4).map(file => (
              <li key={file.key} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 px-3 py-2">
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-brand-300" />
                  {file.originalName}
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-400">
                  {file.kind}
                </span>
              </li>
            ))}
            {!isLoading && files.length === 0 && <li className="text-xs text-slate-500">No uploads yet.</li>}
          </ul>
        </SectionCard>

        <SectionCard title="Evaluations">
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {evaluations.slice(0, 4).map(evaluation => (
              <li key={evaluation.id ?? evaluation.fileKey ?? evaluation.jobId} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 px-3 py-2">
                <span className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-brand-300" />
                  {evaluation.label ?? evaluation.jobId ?? 'Evaluation'}
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-emerald-200">
                  {evaluation.score !== undefined ? `${Math.round(evaluation.score * 100)}%` : 'Pending'}
                </span>
              </li>
            ))}
            {!isLoading && evaluations.length === 0 && <li className="text-xs text-slate-500">No evaluations yet.</li>}
          </ul>
        </SectionCard>
      </div>
    </section>
  );
}
