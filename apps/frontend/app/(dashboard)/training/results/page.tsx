'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { fetchTrainingResults, TrainingResultFile } from '../../../../lib/api';
import { useProjects } from '../../../../components/ProjectProvider';
import { formatBytes } from '../../../../lib/format';

export default function TrainingResultsPage() {
  const { activeProject } = useProjects();
  const projectId = activeProject?.id;
  const { data, error, isLoading, mutate } = useSWR<TrainingResultFile[]>(
    projectId ? ['training-results', projectId] : null,
    () => fetchTrainingResults(projectId!),
    { refreshInterval: 20000 }
  );

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Training hub</p>
            <h1 className="text-3xl font-semibold text-slate-900">Model artifacts & logs</h1>
            <p className="text-slate-500">
              Review outputs saved under <code className="rounded bg-slate-100 px-1">results/</code> for the selected project. Each entry is
              directly downloadable from S3.
            </p>
          </div>
          <Link href="/training" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600">
            Back to Training Hub
          </Link>
        </div>
      </header>

      {!projectId && <p className="text-sm text-slate-600">Select a project from the top bar to load training results.</p>}

      {projectId && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Results for {activeProject?.name}</h2>
              <p className="text-sm text-slate-500">Most recent artifacts from completed training jobs.</p>
            </div>
            <button
              type="button"
              onClick={() => mutate()}
              className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
            >
              Refresh
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">File</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Last modified</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.map(file => {
                  const relative = file.key.split('/results/')[1] ?? file.key;
                  return (
                    <tr key={file.key}>
                      <td className="px-3 py-3 font-medium text-slate-900">{relative}</td>
                      <td className="px-3 py-3 text-slate-600">{formatBytes(file.size)}</td>
                      <td className="px-3 py-3 text-slate-600">{file.lastModified ? new Date(file.lastModified).toLocaleString() : '—'}</td>
                      <td className="px-3 py-3 text-right">
                        <a
                          href={file.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:border-blue-400"
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && !error && (data?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                      No artifacts yet. Launch a job and check back after it completes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {isLoading && <p className="mt-3 text-sm text-slate-500">Loading results…</p>}
          {error && <p className="mt-3 text-sm text-rose-600">Unable to load results.</p>}
        </section>
      )}
    </div>
  );
}
