'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { fetchIngestions, IngestionRecord } from '../../../lib/api';

export default function IngestionsPage() {
  const { data: ingestions, error, isLoading } = useSWR<IngestionRecord[]>(
    'ingestions',
    fetchIngestions,
    { refreshInterval: 20000 }
  );

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Datasets API</p>
            <h1 className="text-3xl font-semibold text-slate-900">Programmable ingestions</h1>
            <p className="text-slate-500">Connect legacy rules engines or upload files through the REST interface. SDKs and streaming transforms are coming soon.</p>
          </div>
          <span className="rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">Coming soon</span>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Recent ingestions</h2>
            <p className="text-sm text-slate-500">API submissions appear here as soon as they hit the queue.</p>
          </div>
          <Link href="/data" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600">
            Go to dataset uploads
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Tags</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ingestions?.map(item => (
                <tr key={item.id ?? item.fileKey}>
                  <td className="px-3 py-3 text-slate-900">{item.name}</td>
                  <td className="px-3 py-3 capitalize text-slate-600">{item.sourceType?.replace('-', ' ') ?? 'n/a'}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {item.status ?? 'processing'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">{item.tags?.join(', ') || '—'}</td>
                  <td className="px-3 py-3 text-slate-500">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {!isLoading && !error && (ingestions?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                    No ingestions yet. Use the REST endpoint at <code className="rounded bg-slate-100 px-1">/api/ingestions</code> to register one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {isLoading && <p className="mt-3 text-sm text-slate-500">Loading ingestions…</p>}
        {error && <p className="mt-3 text-sm text-rose-600">Unable to load ingestions.</p>}
      </section>
    </div>
  );
}
