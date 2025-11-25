'use client';

import { useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { abortMultipartUpload, completeMultipartUpload, initiateMultipartUpload, signMultipartPart } from '../lib/api';
import { formatBytes } from '../lib/format';
import { useProjects } from './ProjectProvider';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

interface FileUploadPanelProps {
  onUploaded?: (key: string) => void;
}

function parseTags(value: string) {
  if (!value) return undefined;
  const tags = value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
  return tags.length ? tags : undefined;
}

export function FileUploadPanel({ onUploaded }: FileUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Dataset');
  const [tagInput, setTagInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { mutate } = useSWRConfig();
  const { activeProject } = useProjects();
  const tags = useMemo(() => parseTags(tagInput), [tagInput]);

  const handleUpload = async () => {
    if (!file) {
      setStatus('Pick a file to upload.');
      return;
    }
    if (!activeProject) {
      setStatus('Create or select a project before uploading.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setStatus(`Files must be ${formatBytes(MAX_FILE_SIZE_BYTES)} or smaller. Selected file is ${formatBytes(file.size)}.`);
      return;
    }

    setBusy(true);
    setProgress(0);
    setStatus('Starting secure upload session...');
    let session:
      | {
          uploadId: string;
          key: string;
          partSize: number;
        }
      | null = null;

    try {
      const initiated = await initiateMultipartUpload({
        fileName: file.name,
        contentType: file.type,
        kind: 'ingestion',
        projectId: activeProject.id,
        size: file.size,
        title: title || file.name,
        description,
        category,
        tags
      });
      session = initiated;
      setStatus('Uploading parts to S3...');

      const partSize = initiated.partSize ?? 5 * 1024 * 1024;
      const totalParts = Math.ceil(file.size / partSize);
      const parts: Array<{ partNumber: number; etag: string }> = [];

      for (let index = 0; index < totalParts; index += 1) {
        const partNumber = index + 1;
        const start = index * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);

        const { url } = await signMultipartPart({
          uploadId: initiated.uploadId,
          projectId: activeProject.id,
          key: initiated.key,
          partNumber
        });

        const upload = await fetch(url, {
          method: 'PUT',
          body: chunk,
          headers: { 'Content-Type': file.type || 'application/octet-stream' }
        });

        if (!upload.ok) {
          throw new Error(`Failed to upload part ${partNumber}`);
        }

        const etag = (upload.headers.get('ETag') ?? upload.headers.get('etag'))?.replace(/"/g, '');
        if (!etag) {
          throw new Error('Missing ETag from S3 response');
        }

        parts.push({ partNumber, etag });
        setProgress(Math.round((partNumber / totalParts) * 100));
      }

      await completeMultipartUpload({
        uploadId: initiated.uploadId,
        key: initiated.key,
        projectId: activeProject.id,
        parts,
        title: title || file.name,
        description,
        category,
        tags,
        size: file.size,
        contentType: file.type
      });

      setStatus(`Uploaded to ${activeProject.name}`);
      onUploaded?.(initiated.key);
      setFile(null);
      setTitle('');
      setDescription('');
      setTagInput('');
      mutate(['history', activeProject.id]);
      mutate(['ingestion-files', activeProject.id]);
      mutate(['project-files', activeProject.id]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed');
      if (session) {
        await abortMultipartUpload({
          uploadId: session.uploadId,
          key: session.key,
          projectId: activeProject.id
        }).catch(() => null);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Datasets</p>
          <h3 className="text-xl font-semibold text-slate-900">
            Upload to {activeProject ? `${activeProject.name}` : 'a project'}
          </h3>
          <p className="text-xs text-slate-500">
            Max file size {formatBytes(MAX_FILE_SIZE_BYTES)}. Files live under the selected project&apos;s S3 folder.
          </p>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {activeProject ? `Project scope: ${activeProject.name}` : 'Select a project'}
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-700">
          Dataset name
          <input
            type="text"
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="e.g. Support transcripts"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-700">
          Category
          <input
            type="text"
            value={category}
            onChange={event => setCategory(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-700 md:col-span-2">
          Description
          <textarea
            value={description}
            onChange={event => setDescription(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            placeholder="What does this dataset contain?"
          />
        </label>
        <label className="text-sm text-slate-700">
          Tags (comma separated)
          <input
            type="text"
            value={tagInput}
            onChange={event => setTagInput(event.target.value)}
            placeholder="finance, qa"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-700">
          File
          <div className="mt-1 flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2">
            <Upload className="h-4 w-4 text-slate-500" />
            <input
              type="file"
              className="text-xs text-slate-500"
              onChange={event => setFile(event.target.files?.[0] ?? null)}
              disabled={!activeProject}
            />
          </div>
          {file && <p className="mt-1 text-xs text-slate-500">{file.name}</p>}
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
        <button
          type="button"
          onClick={handleUpload}
          disabled={busy || !activeProject}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {busy ? 'Uploading…' : activeProject ? `Upload to ${activeProject.name}` : 'Select a project'}
        </button>
        {progress > 0 && busy && <p className="text-xs text-slate-500">Progress: {progress}%</p>}
        {status && <p className="text-xs text-slate-600">{status}</p>}
      </div>
      {!activeProject && (
        <p className="mt-2 text-xs text-amber-600">
          Create your first project above to enable uploads for your workspace.
        </p>
      )}
    </section>
  );
}
