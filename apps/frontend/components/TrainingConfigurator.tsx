'use client';

import { useMemo, useState } from 'react';
import { createJob, TrainingMethod } from '../lib/api';

const methodOptions: { label: string; value: TrainingMethod; description: string }[] = [
  { label: 'QLoRA', value: 'qlora', description: '4-bit adapters for efficient GPUs' },
  { label: 'LoRA', value: 'lora', description: 'Rank-decomposed adapters for mid-size jobs' },
  { label: 'Full fine-tune', value: 'full', description: 'All weights update for maximum fidelity' },
  { label: 'New transformer', value: 'new-transformer', description: 'Spin up a bespoke architecture' }
];

export function TrainingConfigurator() {
  const [method, setMethod] = useState<TrainingMethod>('qlora');
  const [layers, setLayers] = useState(4);
  const [baseModel, setBaseModel] = useState('meta-llama/Llama-3.2-3B-Instruct');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const handleSubmit = async () => {
    setBusy(true);
    setStatus('Submitting job...');
    try {
      await createJob({
        datasetUri: 's3://deepfinery-datasets/example.jsonl',
        method,
        hyperparams: {
          baseModel,
          sequenceLength: 512,
          batchSize: 1,
          gradientAccumulation: 4,
          epochs: 2,
          learningRate: 1e-4,
          rank: method === 'full' ? undefined : 32,
          alpha: method === 'full' ? undefined : 16,
          dropout: 0.05,
          packing: true
        },
        outputUri: 's3://deepfinery-trained-models/latest'
      });
      setStatus('Job queued successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to submit job');
    } finally {
      setBusy(false);
    }
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
          Base model
          <select
            value={baseModel}
            onChange={event => setBaseModel(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-white shadow-inner"
          >
            <option value="meta-llama/Llama-3.2-3B-Instruct">Llama 3.2 3B Instruct</option>
            <option value="meta-llama/Llama-3.1-8B-Instruct">Llama 3.1 8B Instruct</option>
            <option value="nvidia/Nemotron-4-340B-Instruct">Nemotron 4 Instruct</option>
          </select>
        </label>

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
