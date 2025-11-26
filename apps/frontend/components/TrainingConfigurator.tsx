'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  ClusterSummary,
  createJob,
  fetchClusters,
  fetchFiles,
  fetchOrgContext,
  FileRecord,
  TrainingMethod,
  TrainerJobSpec
} from '../lib/api';
import { useProjects } from './ProjectProvider';

const methodOptions: { label: string; value: TrainingMethod; description: string }[] = [
  { label: 'QLoRA', value: 'qlora', description: '4-bit adapters for efficient GPUs' },
  { label: 'LoRA', value: 'lora', description: 'Rank-decomposed adapters for mid-size jobs' },
  { label: 'Full fine-tune', value: 'full', description: 'All weights update for maximum fidelity' },
  { label: 'New transformer', value: 'new-transformer', description: 'Spin up a bespoke architecture' }
];

const baseModelOptions = [
  { label: 'Llama 3.2 3B Instruct', value: 'meta-llama/Llama-3.2-3B-Instruct', provider: 'huggingface' as const, maxLayers: 8 },
  { label: 'Llama 3.1 8B Instruct', value: 'meta-llama/Llama-3.1-8B-Instruct', provider: 'huggingface' as const, maxLayers: 12 },
  { label: 'Nemotron 4 Instruct', value: 'nvidia/Nemotron-4-340B-Instruct', provider: 'nemo' as const, maxLayers: 16 }
];

const gpuOptions = ['L4', 'L40', 'H100', 'H200', 'A100', 'B100', 'B200', 'B10'];

export function TrainingConfigurator() {
  const [method, setMethod] = useState<TrainingMethod>('qlora');
  const [layers, setLayers] = useState(4);
  const [baseModel, setBaseModel] = useState(baseModelOptions[0]);
  const [datasetUri, setDatasetUri] = useState('s3://deepfinery-datasets/example.jsonl');
  const [datasetKey, setDatasetKey] = useState<string | undefined>();
  const [datasetFormat, setDatasetFormat] = useState('auto');
  const [datasetRoleArn, setDatasetRoleArn] = useState('');
  const [jobName, setJobName] = useState('LoRA refinement');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [clusterId, setClusterId] = useState<string | null>(null);
  const [gpus, setGpus] = useState(4);
  const [gpuType, setGpuType] = useState('A100');
  const [maxDuration, setMaxDuration] = useState(720);
  const HF_PLACEHOLDER = '********';
  const { activeProject } = useProjects();
  const projectId = activeProject?.id;
  const { data: files } = useSWR<FileRecord[]>(
    projectId ? ['ingestion-files', projectId] : null,
    () => fetchFiles('ingestion', projectId!),
    { refreshInterval: 15000 }
  );
  const { data: clusters } = useSWR<ClusterSummary[]>('clusters', fetchClusters, { refreshInterval: 30000 });
  const { data: orgContext } = useSWR('org-context', fetchOrgContext, { refreshInterval: 60000 });
  const hasHfToken = orgContext?.orgSecrets?.hasHuggingfaceToken ?? false;
  const [hfTokenInput, setHfTokenInput] = useState('');

  useEffect(() => {
    setDatasetKey(undefined);
  }, [projectId]);

  const inferDatasetFormat = (value: string) => {
    const lower = value.toLowerCase();
    if (lower.endsWith('.jsonl')) return 'jsonl';
    if (lower.endsWith('.csv')) return 'csv';
    if (lower.endsWith('.parquet')) return 'parquet';
    return 'auto';
  };

  const updateDatasetFromFile = (file: FileRecord) => {
    setDatasetKey(file.key);
    setDatasetUri(`s3://${file.bucket}/${file.key}`);
    setDatasetFormat(inferDatasetFormat(file.originalName));
  };

  useEffect(() => {
    if (files && files.length > 0 && !datasetKey) {
      updateDatasetFromFile(files[0]);
    }
  }, [files, datasetKey]);

  useEffect(() => {
    setHfTokenInput(hasHfToken ? HF_PLACEHOLDER : '');
  }, [hasHfToken]);

  const maxLayers = baseModel.maxLayers;

  const layerAnimation = useMemo(() => {
    const blocks = [];
    for (let i = 0; i < maxLayers; i += 1) {
      const active = i < layers;
      blocks.push(
        <div
          key={i}
          className={`h-2 flex-1 rounded-full ${active ? 'bg-blue-500' : 'bg-slate-200'}`}
        />
      );
    }
    return blocks;
  }, [layers, maxLayers]);

  useEffect(() => {
    if (!clusters || clusters.length === 0 || clusterId) return;
    const preferred = orgContext?.org?.defaultClusterId;
    const fallback = preferred && clusters.some(cluster => cluster.id === preferred) ? preferred : clusters[0]?.id;
    if (fallback) setClusterId(fallback);
  }, [clusters, clusterId, orgContext]);

  const handleSubmit = async () => {
    if (!clusterId) {
      setStatus('Select a cluster first.');
      return;
    }
    if (!projectId) {
      setStatus('Select a project and dataset before launching.');
      return;
    }

    setBusy(true);
    setStatus('Submitting job...');
    try {
      const spec: TrainerJobSpec = {
        baseModel: {
          provider: baseModel.provider,
          modelName: baseModel.value,
          revision: 'main'
        },
        customization: {
          method,
          rank: method === 'full' ? undefined : layers * 8,
          targetModules: ['q_proj', 'v_proj'],
          loraAlpha: 32,
          loraDropout: 0.05,
          trainableLayers: ['decoder.layers.0'],
          precision: 'bf16',
          qlora: method === 'qlora' ? { use_double_quant: true, bnb_4bit_compute_dtype: 'bfloat16' } : undefined,
          peft: { use: method !== 'full', config: { task_type: 'CAUSAL_LM' } }
        },
        resources: {
          gpus,
          gpuType,
          cpus: 16,
          memoryGb: 128,
          maxDurationMinutes: maxDuration
        },
        datasets: [
          {
            source: datasetUri,
            format: datasetFormat || 'auto',
            auth: datasetRoleArn ? { role_arn: datasetRoleArn } : undefined
          }
        ],
        artifacts: {
          outputUri: `s3://deepfinery-trained-models/${jobName
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')}-${Date.now()}`
        },
        tuningParameters: {
          learning_rate: 2e-4,
          batch_size: 64,
          num_epochs: 3,
          warmup_ratio: 0.1,
          gradient_checkpointing: true,
          max_sequence_length: 4096
        }
      };

      if (hfTokenInput && hfTokenInput !== HF_PLACEHOLDER) {
        spec.baseModel.authToken = hfTokenInput;
        spec.baseModel.huggingfaceToken = hfTokenInput;
      }

      await createJob({
        name: jobName,
        clusterId,
        projectId,
        spec
      });
      setStatus('Job queued successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to submit job');
    } finally {
      setBusy(false);
    }
  };

  const renderCluster = (cluster: ClusterSummary) => {
    const selected = cluster.id === clusterId;
    const badge =
      cluster.kind === 'managed' || cluster.requiresPayment
        ? 'Billable ($50/run)'
        : 'Org free tier (≤100 jobs)';
    return (
      <label
        key={cluster.id}
        className={`flex cursor-pointer flex-col gap-2 rounded-lg border px-4 py-3 transition ${
          selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{cluster.name}</p>
            <p className="text-xs text-slate-500 capitalize">
              {cluster.provider} · {cluster.metadata?.region ?? 'multi-region'}
            </p>
          </div>
          <input
            type="radio"
            name="cluster"
            value={cluster.id}
            checked={selected}
            onChange={() => setClusterId(cluster.id)}
            className="accent-blue-500"
          />
        </div>
        <p className="text-xs text-slate-500">{badge}</p>
      </label>
    );
  };

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Configure</p>
          <h2 className="text-2xl font-semibold text-slate-900">Training recipe</h2>
          <p className="text-sm text-slate-500">Fill in resources, point to a dataset, and select a cluster to dispatch.</p>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-600">
          {projectId ? `Project: ${activeProject?.name ?? projectId}` : 'Select a project to surface uploads'}
        </div>
      </div>

      <div className="grid gap-4">
        <label className="text-sm text-slate-700">
          Job name
          <input
            type="text"
            value={jobName}
            onChange={event => setJobName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-700">
          Dataset location
          <input
            type="text"
            value={datasetUri}
            onChange={event => {
              setDatasetUri(event.target.value);
              setDatasetFormat(inferDatasetFormat(event.target.value));
            }}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </label>
        {projectId && files && files.length > 0 && (
          <label className="text-sm text-slate-700">
            Select dataset from project
            <select
              value={datasetKey ?? ''}
              onChange={event => {
                const file = files.find(f => f.key === event.target.value);
                if (file) {
                  updateDatasetFromFile(file);
                }
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {files.map(file => (
                <option key={file.key} value={file.key}>
                  {file.originalName}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">Files scoped to {activeProject?.name}. Manage uploads on the <Link className="text-blue-600" href="/data">Data</Link> tab.</p>
          </label>
        )}
        {!projectId && <p className="text-xs text-amber-600">Select or create a project to surface recent dataset uploads here.</p>}
        <label className="text-sm text-slate-700">
          Dataset format
          <select
            value={datasetFormat}
            onChange={event => setDatasetFormat(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="auto">Auto detect</option>
            <option value="jsonl">JSONL</option>
            <option value="csv">CSV</option>
            <option value="parquet">Parquet</option>
          </select>
        </label>
        <label className="text-sm text-slate-700">
          Dataset IAM role (optional)
          <input
            type="text"
            value={datasetRoleArn}
            onChange={event => setDatasetRoleArn(event.target.value)}
            placeholder="arn:aws:iam::123:role/FineTune"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <p className="text-xs text-slate-500">Included as datasets[].auth.role_arn so the trainer can assume the right permissions.</p>
        </label>
        <p className="text-xs text-slate-500">
          Recommended layout: <code className="rounded bg-slate-100 px-1">s3://deepfinery-training-data-*/users/&lt;userId&gt;/projects/&lt;projectId&gt;/ingestion/&lt;file&gt;</code>. Logs/results are written back
          under the same project prefix.
        </p>
        <label className="text-sm text-slate-700">
          Base model
          <select
            value={baseModel.value}
            onChange={event => {
              const model = baseModelOptions.find(option => option.value === event.target.value);
              if (model) setBaseModel(model);
            }}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {baseModelOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-700">
          Hugging Face token
          <input
            type="password"
            value={hfTokenInput}
            onChange={event => setHfTokenInput(event.target.value)}
            placeholder={hasHfToken ? HF_PLACEHOLDER : 'hf_xxx'}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <p className="text-xs text-slate-500">Leave blank to reuse the workspace token.</p>
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm text-slate-700">
            GPUs
            <input
              type="number"
              min={1}
              max={16}
              value={gpus}
              onChange={event => setGpus(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="text-sm text-slate-700">
            GPU type
            <select
              value={gpuType}
              onChange={event => setGpuType(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {gpuOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Max duration (min)
            <input
              type="number"
              min={60}
              max={1440}
              step={60}
              value={maxDuration}
              onChange={event => setMaxDuration(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm text-slate-700">
            <p>Layers added</p>
            <p className="font-mono text-slate-500">{layers} / {maxLayers}</p>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={maxLayers}
              value={layers}
              onChange={event => setLayers(Number(event.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <div className="mt-3 flex gap-2">{layerAnimation}</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {methodOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => setMethod(option.value)}
            className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
              method === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-slate-200 text-slate-700 hover:border-blue-400'
            }`}
          >
            <p className="text-base font-semibold">{option.label}</p>
            <p className="text-xs text-slate-500">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Target cluster</p>
        <div className="grid gap-3 md:grid-cols-2">
          {clusters && clusters.length > 0 ? (
            clusters.map(renderCluster)
          ) : (
            <p className="text-sm text-slate-500">No clusters configured yet.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Dispatching…' : 'Launch training job'}
        </button>
        {status && <p className="text-sm text-slate-600">{status}</p>}
      </div>
    </section>
  );
}
