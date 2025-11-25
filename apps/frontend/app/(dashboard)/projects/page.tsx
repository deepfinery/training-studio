'use client';

import Link from 'next/link';
import { useProjects } from '../../../components/ProjectProvider';

export default function ProjectsPage() {
  const { projects, isLoading, deleteProject } = useProjects();

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Workspace</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Projects</h1>
            <p className="text-slate-500">Organize datasets, experiments, and assets per workspace.</p>
          </div>
          <Link
            href="/projects/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            New project
          </Link>
        </div>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading && <p className="text-sm text-slate-500">Loading projects…</p>}
        {!isLoading && projects.length === 0 && (
          <p className="text-sm text-slate-500">No projects yet. Create one to get started.</p>
        )}
        {projects.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map(project => (
                  <tr key={project.id}>
                    <td className="px-3 py-3 text-slate-900">{project.name}</td>
                    <td className="px-3 py-3 text-slate-500">{project.slug}</td>
                    <td className="px-3 py-3 text-slate-500">{new Date(project.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`Delete project "${project.name}" and all datasets?`)) return;
                          await deleteProject(project.id);
                        }}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-500"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
