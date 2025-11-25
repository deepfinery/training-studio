'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { AlertCircle, Loader2, RefreshCw, Trash2, XCircle } from 'lucide-react';
import { cancelTrainingJob, deleteTrainingJob, fetchJobs, TrainingJob } from '../lib/api';

const statusStyles: Record<TrainingJob['status'], string> = {
  queued: 'bg-amber-50 text-amber-700 border-amber-200',
  running: 'bg-blue-50 text-blue-700 border-blue-200',
  succeeded: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200'
};

interface TrainingJobsTableProps {
  title?: string;
  description?: string;
  limit?: number;
  allowActions?: boolean;
}

export function TrainingJobsTable({
  title = 'Training jobs',
  description = 'Latest activity across your workspace',
  limit,
  allowActions = true
}: TrainingJobsTableProps) {
  const { data, error, isLoading, mutate } = useSWR('jobs', fetchJobs, { refreshInterval: 8000 });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const jobs = data ? (limit ? data.slice(0, limit) : data) : [];

  const handleCancel = async (jobId: string) => {
    setBusyId(jobId);
    setMessage(null);
    try {
      await cancelTrainingJob(jobId);
      await mutate();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to cancel job');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Delete this job from the workspace history? This cannot be undone.')) {
      return;
    }
    setBusyId(jobId);
    setMessage(null);
    try {
      await deleteTrainingJob(jobId);
      await mutate();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to delete job');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Training</p>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" /> Unable to load jobs
        </p>
      )}
      {message && <p className="mt-3 text-sm text-rose-600">{message}</p>}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Job</th>
              <th className="px-3 py-2">Dataset</th>
              <th className="px-3 py-2">Cluster</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Updated</th>
              {allowActions && <th className="px-3 py-2 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map(job => {
              const busy = busyId === job.id;
              const canCancel = allowActions && (job.status === 'queued' || job.status === 'running');
              const canDelete = allowActions;
              return (
                <tr key={job.id}>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-900">{job.name ?? job.jobSpec.baseModel.modelName}</div>
                    <p className="text-xs text-slate-500 truncate max-w-xs">{job.jobSpec.baseModel.modelName}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    <p className="truncate max-w-xs" title={job.datasetUri}>
                      {job.datasetUri}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    <div>{job.clusterName}</div>
                    <p className="text-xs text-slate-400 capitalize">{job.clusterProvider}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[job.status]}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{new Date(job.updatedAt).toLocaleString()}</td>
                  {allowActions && (
                    <td className="px-3 py-3 text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancel(job.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-amber-400 hover:text-amber-600 disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                            Cancel
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(job.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 disabled:opacity-50"
                          >
                            {busy && !canCancel ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {!isLoading && jobs.length === 0 && (
              <tr>
                <td colSpan={allowActions ? 6 : 5} className="px-3 py-6 text-center text-sm text-slate-500">
                  No jobs yet. Launch one to populate this table.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading jobs…</p>}
    </section>
  );
}
