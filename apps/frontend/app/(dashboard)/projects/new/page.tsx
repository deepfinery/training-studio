'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '../../../../components/ProjectProvider';

export default function NewProjectPage() {
  const { createProject } = useProjects();
  const router = useRouter();
  const [name, setName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setStatus('Project name is required.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await createProject(name.trim());
      setStatus('Project created.');
      router.push('/projects');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to create project');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Workspace</p>
        <h1 className="text-3xl font-semibold text-slate-900">Create a project</h1>
        <p className="text-slate-500">Projects isolate datasets, jobs, and billing.</p>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm text-slate-700">
            Project name
            <input
              type="text"
              value={name}
              onChange={event => setName(event.target.value)}
              maxLength={80}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              placeholder="e.g. Conversational AI"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create project'}
          </button>
          {status && <p className="text-sm text-slate-600">{status}</p>}
        </form>
      </section>
    </div>
  );
}
