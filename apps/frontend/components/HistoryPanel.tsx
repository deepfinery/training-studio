'use client';

import useSWR from 'swr';
import { Clock3, FolderOpen, Gauge } from 'lucide-react';
import { EvaluationRecord, FileRecord, fetchHistory, TrainingJob } from '../lib/api';
import { useProjects } from './ProjectProvider';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{title}</p>
      {children}
    </article>
  );
}

export function HistoryPanel() {
  const { activeProject } = useProjects();
  const { data, error, isLoading, mutate } = useSWR(
    activeProject?.id ? ['history', activeProject.id] : null,
    ([, projectId]) => fetchHistory(projectId),
    { refreshInterval: 12000 }
  );

  const jobs: TrainingJob[] = data?.jobs ?? [];
  const files: FileRecord[] = data?.files ?? [];
  const evaluations: EvaluationRecord[] = data?.evaluations ?? [];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-brand-200">History</p>
          <h3 className="text-2xl font-semibold text-white">Previous jobs & assets</h3>
          {activeProject && <p className="text-xs text-slate-400">Project: {activeProject.name}</p>}
        </div>
        <div className="text-right text-xs text-slate-400">
          {activeProject && (
            <button onClick={() => mutate()} className="text-xs text-slate-400 hover:text-white">
              Refresh
            </button>
          )}
          {!activeProject && <p>Select a project to load history.</p>}
        </div>
      </div>
      {isLoading && activeProject && <p className="mt-3 text-sm text-slate-500">Loading history…</p>}
      {error && activeProject && <p className="mt-3 text-sm text-rose-500">Unable to load history</p>}
      {!activeProject && <p className="mt-3 text-sm text-slate-500">Create a project to start tracking assets.</p>}
      {activeProject && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <SectionCard title="Training jobs">
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {jobs.slice(0, 4).map(job => (
                <li key={job.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-brand-300" />
                    {job.name ?? job.jobSpec.baseModel.modelName ?? job.id}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-500">
                    {job.status}
                  </span>
                </li>
              ))}
              {!isLoading && jobs.length === 0 && <li className="text-xs text-slate-500">No jobs yet.</li>}
            </ul>
        </SectionCard>

        <SectionCard title="Files">
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {files.slice(0, 4).map(file => (
              <li key={file.key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-brand-300" />
                  {file.originalName}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-500">
                  {file.kind}
                </span>
              </li>
            ))}
            {!isLoading && files.length === 0 && <li className="text-xs text-slate-500">No uploads yet.</li>}
          </ul>
        </SectionCard>

        <SectionCard title="Evaluations">
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {evaluations.slice(0, 4).map(evaluation => (
              <li key={evaluation.id ?? evaluation.fileKey ?? evaluation.jobId} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
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
      )}
    </section>
  );
}
