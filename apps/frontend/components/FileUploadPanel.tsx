'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { completeUpload, requestUpload } from '../lib/api';

interface FileUploadPanelProps {
  onUploaded?: (key: string) => void;
}

export function FileUploadPanel({ onUploaded }: FileUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const handleUpload = async () => {
    if (!file) {
      setStatus('Pick a file to upload.');
      return;
    }

    setBusy(true);
    setStatus('Preparing secure upload link...');

    try {
      const presign = await requestUpload({
        fileName: file.name,
        contentType: file.type,
        kind: 'ingestion'
      });

      setStatus('Uploading to S3...');
      const res = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file
      });

      if (!res.ok) {
        throw new Error('Upload to S3 failed');
      }

      await completeUpload({ key: presign.key, size: file.size, contentType: file.type });
      setStatus(`Uploaded to ${presign.key}`);
      onUploaded?.(presign.key);
      mutate('history');
      mutate('ingestion-files');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass-panel rounded-3xl border border-white/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Datasets</p>
          <h3 className="text-xl font-semibold text-white">Upload to your S3 partition</h3>
        </div>
        <div className="rounded-full bg-brand-500/10 px-3 py-1 text-xs text-brand-100">Per-user isolation</div>
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-4">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          <span className="flex items-center gap-2 text-slate-200">
            <Upload className="h-4 w-4 text-brand-300" />
            Choose file
          </span>
          <input
            type="file"
            className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-slate-200 file:mr-3 file:rounded-lg file:border-none file:bg-brand-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-50"
            onChange={event => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          onClick={handleUpload}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {busy ? 'Uploading…' : 'Upload to S3'}
        </button>
        {status && <p className="text-xs text-slate-300">{status}</p>}
      </div>
    </section>
  );
}
