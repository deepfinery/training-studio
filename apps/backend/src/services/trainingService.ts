import { v4 as uuid } from 'uuid';
import { TrainingJob, TrainingJobRequest } from '../types/training';

export class TrainingService {
  private jobs = new Map<string, TrainingJob>();

  listJobs(): TrainingJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getJob(id: string): TrainingJob | undefined {
    return this.jobs.get(id);
  }

  createJob(payload: TrainingJobRequest): TrainingJob {
    const now = new Date().toISOString();
    const job: TrainingJob = {
      id: uuid(),
      status: 'queued',
      method: payload.method,
      datasetUri: payload.datasetUri,
      outputUri: payload.outputUri ?? `s3://deepfinery-models/${Date.now()}`,
      hyperparams: payload.hyperparams,
      createdAt: now,
      updatedAt: now,
      logs: [
        'Job created locally. Connect cloud runner when available.',
        'Waiting for dataset upload confirmation...'
      ]
    };

    this.jobs.set(job.id, job);
    return job;
  }

  updateJobStatus(id: string, status: TrainingJob['status'], log?: string): TrainingJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    const updated: TrainingJob = {
      ...job,
      status,
      updatedAt: new Date().toISOString(),
      logs: log ? [...(job.logs ?? []), log] : job.logs
    };

    this.jobs.set(id, updated);
    return updated;
  }
}

export const trainingService = new TrainingService();
