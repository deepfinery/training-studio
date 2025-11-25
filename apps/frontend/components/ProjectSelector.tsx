'use client';

import Link from 'next/link';
import { FolderPlus } from 'lucide-react';
import { useProjects } from './ProjectProvider';

export function ProjectSelector() {
  const { projects, activeProject, selectProject, isLoading, error } = useProjects();

  if (projects.length === 0) {
    return (
      <div className="w-full max-w-sm rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <p className="font-semibold">You need a project</p>
        <p className="text-xs text-blue-800">Create your first project to get started.</p>
        <Link href="/projects/new" className="mt-2 inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
          <FolderPlus className="h-4 w-4" />
          New project
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Project</p>
      <div className="flex items-center gap-2">
        <select
          value={activeProject?.id ?? ''}
          onChange={event => selectProject(event.target.value)}
          disabled={isLoading}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm"
        >
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <Link
          href="/projects"
          className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
        >
          Manage
        </Link>
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
