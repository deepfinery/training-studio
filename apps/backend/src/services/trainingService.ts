import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { getCollection } from '../config/database';
import { TrainingJob, TrainingJobRequest } from '../types/training';

type TrainingJobRecord = TrainingJob & { _id?: ObjectId };

function normalizeJob(doc: TrainingJobRecord): TrainingJob {
  const { _id, ...rest } = doc;
  return { ...rest, id: rest.id || _id?.toString() || uuid() };
}

export class TrainingService {
  private memoryJobs = new Map<string, TrainingJob>();

  private async jobsCollection() {
    try {
      return await getCollection<TrainingJobRecord>('jobs');
    } catch (error) {
      // Fall back to in-memory mode if DocumentDB is not reachable during dev
      return null;
    }
  }

  async listJobs(userId: string): Promise<TrainingJob[]> {
    const collection = await this.jobsCollection();
    if (collection) {
      const docs = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
      return docs.map(normalizeJob);
    }

    return Array.from(this.memoryJobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getJob(userId: string, id: string): Promise<TrainingJob | undefined> {
    const collection = await this.jobsCollection();
    if (collection) {
      const doc = await collection.findOne({ userId, id });
      return doc ? normalizeJob(doc) : undefined;
    }

    return this.memoryJobs.get(id);
  }

  async createJob(userId: string, payload: TrainingJobRequest): Promise<TrainingJob> {
    const now = new Date().toISOString();
    const job: TrainingJob = {
      id: uuid(),
      userId,
      status: 'queued',
      method: payload.method,
      name: payload.name ?? `Job ${new Date().toLocaleString()}`,
      datasetUri: payload.datasetUri,
      datasetKey: payload.datasetKey,
      outputUri: payload.outputUri ?? `s3://${payload.outputBucket ?? 'deepfinery-trained-models'}/${userId}/${Date.now()}`,
      hyperparams: payload.hyperparams,
      createdAt: now,
      updatedAt: now,
      logs: [
        'Job created locally. Connect cloud runner when available.',
        'Waiting for dataset upload confirmation...'
      ]
    };

    const collection = await this.jobsCollection();
    if (collection) {
      await collection.insertOne({ ...job, userId });
    } else {
      this.memoryJobs.set(job.id, job);
    }

    return job;
  }

  async updateJobStatus(userId: string, id: string, status: TrainingJob['status'], log?: string) {
    const collection = await this.jobsCollection();
    const updatedAt = new Date().toISOString();

    if (collection) {
      const job = await collection.findOne({ userId, id });
      if (!job) return undefined;

      const logs = log ? [...(job.logs ?? []), log] : job.logs;
      await collection.updateOne({ userId, id }, { $set: { status, updatedAt, logs } });
      return { ...normalizeJob(job), status, updatedAt, logs };
    }

    const job = this.memoryJobs.get(id);
    if (!job) return undefined;
    const updated: TrainingJob = {
      ...job,
      status,
      updatedAt,
      logs: log ? [...(job.logs ?? []), log] : job.logs
    };
    this.memoryJobs.set(id, updated);
    return updated;
  }
}

export const trainingService = new TrainingService();
