'use client';

import useSWR from 'swr';
import { deleteFile, fetchFiles, FileRecord } from '../lib/api';
import { formatBytes } from '../lib/format';
import { useProjects } from './ProjectProvider';

export function DatasetTable() {
  const { activeProject } = useProjects();
  const { data, isLoading, error, mutate } = useSWR(
    activeProject?.id ? ['project-files', activeProject.id] : null,
    () => fetchFiles(undefined, activeProject!.id),
    { refreshInterval: 20000 }
  );

  if (!activeProject) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Select or create a project to see its datasets.</p>
      </div>
    );
  }

  const files: FileRecord[] = data ?? [];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Datasets</h2>
          <p className="text-xs text-slate-500">Project: {activeProject.name}</p>
        </div>
        <button onClick={() => mutate()} className="text-xs font-semibold text-blue-600 hover:text-blue-500">
          Refresh
        </button>
      </div>
      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading datasets…</p>}
      {error && <p className="mt-3 text-sm text-rose-500">Unable to load datasets.</p>}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Size</th>
              <th className="px-3 py-2">Tags</th>
              <th className="px-3 py-2">Uploaded</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {files.map(file => (
              <tr key={file.key}>
                <td className="px-3 py-2">
                  <p className="font-medium text-slate-900">{file.title ?? file.originalName}</p>
                  <p className="text-xs text-slate-500">{file.originalName}</p>
                </td>
                <td className="px-3 py-2 text-slate-600">{file.description ?? '—'}</td>
                <td className="px-3 py-2 text-slate-600">{formatBytes(file.size)}</td>
                <td className="px-3 py-2 text-slate-500">
                  {file.tags && file.tags.length > 0 ? file.tags.join(', ') : '—'}
                </td>
                <td className="px-3 py-2 text-slate-500">{new Date(file.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!file.id) return;
                      if (!window.confirm(`Delete dataset "${file.title ?? file.originalName}"?`)) return;
                      await deleteFile(file.id);
                      mutate();
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && files.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-sm text-slate-500" colSpan={6}>
                  No datasets uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
