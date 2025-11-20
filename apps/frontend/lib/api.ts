export type TrainingMethod = 'qlora' | 'lora' | 'full' | 'new-transformer';

export interface TrainingJob {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  method: TrainingMethod;
  datasetUri: string;
  outputUri: string;
  createdAt: string;
  updatedAt: string;
  hyperparams: {
    baseModel?: string;
    [key: string]: unknown;
  };
  logs?: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';

export async function fetchJobs(): Promise<TrainingJob[]> {
  const res = await fetch(`${API_BASE}/api/training`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load jobs');
  const payload = await res.json();
  return payload.jobs ?? [];
}

export interface CreateJobInput {
  datasetUri: string;
  method: TrainingMethod;
  hyperparams: {
    baseModel: string;
    sequenceLength: number;
    batchSize: number;
    gradientAccumulation: number;
    epochs: number;
    learningRate: number;
    rank?: number;
    alpha?: number;
    dropout?: number;
    packing?: boolean;
  };
  outputUri?: string;
}

export async function createJob(body: CreateJobInput) {
  const res = await fetch(`${API_BASE}/api/training`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to create job');
  }

  return res.json();
}
