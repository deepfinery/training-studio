'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { recordEvaluation } from '../lib/api';

export function EvaluationForm() {
  const { mutate } = useSWRConfig();
  const [jobId, setJobId] = useState('');
  const [label, setLabel] = useState('Quality check');
  const [score, setScore] = useState<number | undefined>(0.92);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await recordEvaluation({
        jobId: jobId || undefined,
        label,
        score,
        notes
      });
      setStatus('Evaluation recorded');
      mutate(
        key => Array.isArray(key) && key[0] === 'history',
        undefined,
        { revalidate: true }
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to record evaluation');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass-panel rounded-3xl border border-white/5 p-5">
      <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Evaluations</p>
      <h3 className="text-xl font-semibold text-white">Log a manual evaluation</h3>
      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-sm text-slate-200">
          Job ID (optional)
          <input
            type="text"
            value={jobId}
            onChange={event => setJobId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white"
            placeholder="job identifier"
          />
        </label>
        <label className="text-sm text-slate-200">
          Label
          <input
            type="text"
            value={label}
            onChange={event => setLabel(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white"
            required
          />
        </label>
        <label className="text-sm text-slate-200">
          Score (0-1)
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={score}
            onChange={event => setScore(Number(event.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white"
            required
          />
        </label>
        <label className="text-sm text-slate-200 md:col-span-2">
          Notes
          <textarea
            value={notes}
            onChange={event => setNotes(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white"
            rows={3}
            placeholder="What did you test or observe?"
          />
        </label>
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-brand-500/30 transition hover:bg-brand-400 disabled:opacity-70"
          >
            {busy ? 'Saving…' : 'Save evaluation'}
          </button>
          {status && <p className="text-xs text-slate-300">{status}</p>}
        </div>
      </form>
    </section>
  );
}
