'use client';

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

const methodOptions: { label: string; value: TrainingMethod; description: string }[] = [
  { label: 'QLoRA', value: 'qlora', description: '4-bit adapters for efficient GPUs' },
  { label: 'LoRA', value: 'lora', description: 'Rank-decomposed adapters for mid-size jobs' },
  { label: 'Full fine-tune', value: 'full', description: 'All weights update for maximum fidelity' },
  { label: 'New transformer', value: 'new-transformer', description: 'Spin up a bespoke architecture' }
];

const baseModelOptions = [
  { label: 'Llama 3.2 3B Instruct', value: 'meta-llama/Llama-3.2-3B-Instruct', provider: 'huggingface' as const },
  { label: 'Llama 3.1 8B Instruct', value: 'meta-llama/Llama-3.1-8B-Instruct', provider: 'huggingface' as const },
  { label: 'Nemotron 4 Instruct', value: 'nvidia/Nemotron-4-340B-Instruct', provider: 'nemo' as const }
];

export function TrainingConfigurator() {
  const [method, setMethod] = useState<TrainingMethod>('qlora');
  const [layers, setLayers] = useState(4);
  const [baseModel, setBaseModel] = useState(baseModelOptions[0]);
  const [datasetUri, setDatasetUri] = useState('s3://deepfinery-datasets/example.jsonl');
  const [datasetKey, setDatasetKey] = useState<string | undefined>();
  const [jobName, setJobName] = useState('LoRA refinement');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [clusterId, setClusterId] = useState<string | null>(null);
  const [gpus, setGpus] = useState(4);
  const [gpuType, setGpuType] = useState('A100');
  const [maxDuration, setMaxDuration] = useState(720);
  const { data: files } = useSWR<FileRecord[]>('ingestion-files', () => fetchFiles('ingestion'), {
    refreshInterval: 15000
  });
  const { data: clusters } = useSWR<ClusterSummary[]>('clusters', fetchClusters, { refreshInterval: 30000 });
  const { data: orgContext } = useSWR('org-context', fetchOrgContext, { refreshInterval: 60000 });

  useEffect(() => {
    if (files && files.length > 0 && !datasetKey) {
      const latest = files[0];
      setDatasetKey(latest.key);
      setDatasetUri(`s3://${latest.bucket}/${latest.key}`);
    }
  }, [files, datasetKey]);

  const layerAnimation = useMemo(() => {
    const blocks = [];
    for (let i = 0; i < 12; i += 1) {
      const active = i < layers;
      blocks.push(
        <div
          key={i}
          className={`h-3 flex-1 rounded-full ${active ? 'bg-brand-400 shadow-lg shadow-brand-500/50' : 'bg-slate-800'}`}
        />
      );
    }
    return blocks;
  }, [layers]);

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
            format: datasetUri.endsWith('.jsonl') ? 'jsonl' : 'auto'
          }
        ],
        artifacts: {
          logUri: `s3://deepfinery-logs/${datasetKey ?? 'latest'}`,
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

      await createJob({
        name: jobName,
        clusterId,
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
        className={`flex cursor-pointer flex-col gap-2 rounded-2xl border px-4 py-3 transition ${selected ? 'border-brand-400 bg-brand-400/10' : 'border-white/10 bg-slate-900/30'}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">{cluster.name}</p>
            <p className="text-xs text-slate-400 capitalize">{cluster.provider} · {cluster.metadata?.region ?? 'multi-region'}</p>
          </div>
          <input
            type="radio"
            name="cluster"
            value={cluster.id}
            checked={selected}
            onChange={() => setClusterId(cluster.id)}
            className="accent-brand-400"
          />
        </div>
        <p className="text-xs text-slate-400">{badge}</p>
      </label>
    );
  };

  return (
    <section className="gradient-card col-span-12 grid gap-6 rounded-3xl px-8 py-6 shadow-2xl md:col-span-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-brand-200">Configure</p>
          <h2 className="text-2xl font-semibold text-white">Training recipe</h2>
        </div>
        <div className="rounded-full border border-white/10 px-4 py-1 text-xs text-slate-300">
          Synthetic curriculum ready
        </div>
      </div>

      <div className="grid gap-4">
        <label className="text-sm text-slate-200">
          Job name
          <input
            type="text"
            value={jobName}
            onChange={event => setJobName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white shadow-inner"
          />
        </label>
        <label className="text-sm text-slate-200">
          Dataset location
          <input
            type="text"
            value={datasetUri}
            onChange={event => setDatasetUri(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white shadow-inner"
          />
        </label>
        {files && files.length > 0 && (
          <div className="text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Recent uploads</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {files.slice(0, 3).map(file => (
                <button
                  key={file.key}
                  onClick={() => {
                    setDatasetKey(file.key);
                    setDatasetUri(`s3://${file.bucket}/${file.key}`);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    datasetKey === file.key ? 'border-brand-400 text-brand-100' : 'border-white/10 text-slate-200'
                  }`}
                >
                  {file.originalName}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="text-sm text-slate-200">
          Base model
          <select
            value={baseModel.value}
            onChange={event => {
              const model = baseModelOptions.find(option => option.value === event.target.value);
              if (model) setBaseModel(model);
            }}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white shadow-inner"
          >
            {baseModelOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm text-slate-200">
            GPUs
            <input
              type="number"
              min={1}
              max={16}
              value={gpus}
              onChange={event => setGpus(Number(event.target.value))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white shadow-inner"
            />
          </label>
          <label className="text-sm text-slate-200">
            GPU type
            <input
              type="text"
              value={gpuType}
              onChange={event => setGpuType(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white shadow-inner"
            />
          </label>
          <label className="text-sm text-slate-200">
            Max duration (min)
            <input
              type="number"
              min={60}
              max={1440}
              step={60}
              value={maxDuration}
              onChange={event => setMaxDuration(Number(event.target.value))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white shadow-inner"
            />
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm text-slate-200">
            <p>Layers added</p>
            <p className="font-mono text-brand-200">{layers} layers</p>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={12}
              value={layers}
              onChange={event => setLayers(Number(event.target.value))}
              className="w-full accent-brand-400"
            />
          </div>
          <div className="mt-3 flex gap-2">{layerAnimation}</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {methodOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setMethod(option.value)}
            className={`rounded-2xl border px-4 py-3 text-left transition hover:border-brand-400 ${
              method === option.value
                ? 'border-brand-400 bg-brand-400/10 text-white'
                : 'border-white/10 bg-slate-900/30 text-slate-200'
            }`}
          >
            <p className="text-base font-semibold">{option.label}</p>
            <p className="text-xs text-slate-400">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/30 p-4">
        <p className="text-sm font-semibold text-white">Target cluster</p>
        <div className="grid gap-3 md:grid-cols-2">
          {clusters && clusters.length > 0 ? clusters.map(renderCluster) : (
            <p className="text-sm text-slate-400">No clusters configured yet.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="rounded-2xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/40 transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? 'Dispatching…' : 'Launch training job'}
        </button>
        {status && <p className="text-sm text-slate-300">{status}</p>}
      </div>
    </section>
  );
}
