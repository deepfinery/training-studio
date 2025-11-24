import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { getCollection } from '../config/database';
import { env } from '../config/env';
import { BillingRecord } from '../types/billing';
import { Cluster } from '../types/cluster';
import { OrgRole } from '../types/org';
import { TrainerJobSpec, TrainingJob, TrainingJobRequest } from '../types/training';

type TrainingJobRecord = TrainingJob & { _id?: ObjectId };

function normalizeJob(doc: TrainingJobRecord): TrainingJob {
  const { _id, ...rest } = doc;
  return { ...rest, id: rest.id || _id?.toString() || uuid() };
}

function toSnakeCase(value: string) {
  return value.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function transformKeys(obj?: Record<string, unknown>) {
  if (!obj) return undefined;
  return Object.entries(obj).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[toSnakeCase(key)] = value;
    return acc;
  }, {});
}

export class TrainingService {
  private memoryJobs = new Map<string, TrainingJob>();

  private async jobsCollection() {
    try {
      return await getCollection<TrainingJobRecord>('jobs');
    } catch {
      return null;
    }
  }

  private filterJobs(jobs: TrainingJob[], userId: string, role: OrgRole, isGlobalAdmin: boolean) {
    if (role === 'admin' || isGlobalAdmin) {
      return jobs;
    }
    return jobs.filter(job => job.userId === userId);
  }

  async listJobs(orgId: string, userId: string, role: OrgRole, isGlobalAdmin: boolean): Promise<TrainingJob[]> {
    const collection = await this.jobsCollection();
    if (collection) {
      const docs = await collection.find({ orgId }).sort({ createdAt: -1 }).limit(100).toArray();
      const jobs = docs.map(normalizeJob);
      return this.filterJobs(jobs, userId, role, isGlobalAdmin);
    }

    const jobs = Array.from(this.memoryJobs.values()).filter(job => job.orgId === orgId);
    return this.filterJobs(
      jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      userId,
      role,
      isGlobalAdmin
    );
  }

  async getJob(orgId: string, jobId: string, userId: string, role: OrgRole, isGlobalAdmin: boolean) {
    const collection = await this.jobsCollection();
    if (collection) {
      const doc = await collection.findOne({ orgId, id: jobId });
      if (!doc) return undefined;
      const job = normalizeJob(doc);
      if (role === 'admin' || isGlobalAdmin || job.userId === userId) {
        return job;
      }
      return undefined;
    }

    const job = this.memoryJobs.get(jobId);
    if (!job) return undefined;
    if (job.orgId !== orgId) return undefined;
    if (role === 'admin' || isGlobalAdmin || job.userId === userId) {
      return job;
    }
    return undefined;
  }

  private buildJobSpec(jobId: string, spec: TrainerJobSpec, cluster: Cluster): TrainerJobSpec {
    const callbackUrl = `${env.PUBLIC_API_BASE_URL.replace(/\/$/, '')}/api/training/webhooks/${jobId}`;
    return {
      ...spec,
      jobId: spec.jobId ?? jobId,
      artifacts: {
        ...spec.artifacts,
        statusStreamUrl: callbackUrl,
        logUri: spec.artifacts.logUri ?? spec.artifacts.outputUri,
        outputUri:
          spec.artifacts.outputUri ??
          `s3://${env.S3_MODEL_BUCKET}/${cluster.orgId}/${jobId}/model-artifacts`
      },
      callbacks: {
        ...(spec.callbacks ?? {}),
        webhookUrl: callbackUrl,
        authHeader: spec.callbacks?.authHeader ?? (cluster.apiToken ? `Bearer ${cluster.apiToken}` : undefined)
      }
    };
  }

  private deriveDatasetUri(spec: TrainerJobSpec) {
    return spec.datasets[0]?.source ?? spec.artifacts.outputUri ?? 's3://unknown-dataset';
  }

  async createJob(params: {
    orgId: string;
    userId: string;
    request: TrainingJobRequest;
    cluster: Cluster;
  }): Promise<TrainingJob> {
    const { orgId, userId, request, cluster } = params;
    const now = new Date().toISOString();
    const jobId = uuid();
    const jobSpec = this.buildJobSpec(jobId, request.spec, cluster);
    const datasetUri = this.deriveDatasetUri(jobSpec);
    const job: TrainingJob = {
      id: jobId,
      orgId,
      userId,
      name: request.name ?? `${jobSpec.baseModel.modelName} @ ${new Date().toLocaleString()}`,
      status: 'queued',
      method: (jobSpec.customization.method as TrainingJob['method']) ?? 'lora',
      datasetUri,
      outputUri: jobSpec.artifacts.outputUri ?? datasetUri,
      jobSpec,
      clusterId: cluster.id,
      clusterName: cluster.name,
      clusterProvider: cluster.provider,
      clusterKind: cluster.kind,
      statusHistory: [{ status: 'queued', at: now, message: 'Job created' }],
      logs: ['Job created, dispatch pending.'],
      createdAt: now,
      updatedAt: now,
      externalPayload: undefined,
      evaluationScore: undefined
    };

    const collection = await this.jobsCollection();
    if (collection) {
      await collection.insertOne(job);
    } else {
      this.memoryJobs.set(job.id, job);
    }

    return job;
  }

  private async persist(job: TrainingJob) {
    const collection = await this.jobsCollection();
    if (collection) {
      await collection.updateOne({ id: job.id }, { $set: job });
    } else {
      this.memoryJobs.set(job.id, job);
    }
  }

  private async mutate(jobId: string, mutator: (job: TrainingJob) => TrainingJob | Promise<TrainingJob>) {
    const job = await this.findJob(jobId);
    if (!job) throw new Error('Job not found');
    const updated = await mutator(job);
    await this.persist(updated);
    return updated;
  }

  async findJob(jobId: string): Promise<TrainingJob | undefined> {
    const collection = await this.jobsCollection();
    if (collection) {
      const doc = await collection.findOne({ id: jobId });
      return doc ? normalizeJob(doc) : undefined;
    }
    return this.memoryJobs.get(jobId);
  }

  async attachBilling(jobId: string, billing: BillingRecord) {
    return this.mutate(jobId, job => ({
      ...job,
      billing,
      updatedAt: new Date().toISOString()
    }));
  }

  async markJobFailed(jobId: string, message: string) {
    await this.mutate(jobId, job => ({
      ...job,
      status: 'failed',
      logs: [...(job.logs ?? []), message],
      statusHistory: [
        ...(job.statusHistory ?? []),
        { status: 'failed', at: new Date().toISOString(), message }
      ],
      updatedAt: new Date().toISOString()
    }));
  }

  async updateJobStatusForOrg(
    orgId: string,
    jobId: string,
    userId: string,
    role: OrgRole,
    isGlobalAdmin: boolean,
    status: TrainingJob['status'],
    log?: string
  ) {
    const job = await this.getJob(orgId, jobId, userId, role, isGlobalAdmin);
    if (!job) return undefined;
    return this.mutate(jobId, current => {
      const logs = log ? [...(current.logs ?? []), log] : current.logs;
      return {
        ...current,
        status,
        logs,
        updatedAt: new Date().toISOString(),
        statusHistory: [
          ...(current.statusHistory ?? []),
          { status, at: new Date().toISOString(), message: log }
        ]
      };
    });
  }

  async updateJobStatusFromCluster(jobId: string, status: TrainingJob['status'], log?: string) {
    return this.mutate(jobId, current => {
      const logs = log ? [...(current.logs ?? []), log] : current.logs;
      return {
        ...current,
        status,
        logs,
        updatedAt: new Date().toISOString(),
        statusHistory: [
          ...(current.statusHistory ?? []),
          { status, at: new Date().toISOString(), message: log }
        ]
      };
    });
  }

  private buildExternalPayload(job: TrainingJob) {
    const spec = job.jobSpec;
    return {
      job_id: spec.jobId ?? job.id,
      base_model: {
        provider: spec.baseModel.provider,
        model_name: spec.baseModel.modelName,
        revision: spec.baseModel.revision ?? 'main',
        auth_token: spec.baseModel.authToken ?? null,
        weights_url: spec.baseModel.weightsUrl ?? null
      },
      customization: {
        method: spec.customization.method,
        rank: spec.customization.rank,
        target_modules: spec.customization.targetModules,
        lora_alpha: spec.customization.loraAlpha,
        lora_dropout: spec.customization.loraDropout,
        trainable_layers: spec.customization.trainableLayers,
        precision: spec.customization.precision,
        qlora: spec.customization.qlora,
        peft: spec.customization.peft
      },
      resources: {
        gpus: spec.resources.gpus,
        gpu_type: spec.resources.gpuType,
        cpus: spec.resources.cpus,
        memory_gb: spec.resources.memoryGb,
        max_duration_minutes: spec.resources.maxDurationMinutes
      },
      datasets: spec.datasets.map(dataset => ({
        source: dataset.source,
        format: dataset.format,
        auth: dataset.auth
      })),
      artifacts: {
        log_uri: spec.artifacts.logUri,
        status_stream_url: spec.artifacts.statusStreamUrl,
        output_uri: spec.artifacts.outputUri
      },
      tuning_parameters: transformKeys(spec.tuningParameters),
      callbacks: spec.callbacks
        ? {
            webhook_url: spec.callbacks.webhookUrl,
            auth_header: spec.callbacks.authHeader
          }
        : undefined
    };
  }

  private async recordExternalPayload(jobId: string, payload: Record<string, unknown>, response?: unknown) {
    await this.mutate(jobId, job => ({
      ...job,
      externalPayload: { payload, response },
      updatedAt: new Date().toISOString(),
      logs: [...(job.logs ?? []), 'Cluster accepted job']
    }));
  }

  async dispatchToCluster(job: TrainingJob, cluster: Cluster) {
    const payload = this.buildExternalPayload(job);
    const url = `${cluster.apiBaseUrl.replace(/\/$/, '')}/train`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (cluster.apiToken) {
      headers.Authorization = `Bearer ${cluster.apiToken}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'unknown error');
      throw new Error(`Cluster rejected job (${res.status}): ${text}`);
    }

    const response = await res.json().catch(() => undefined);
    await this.recordExternalPayload(job.id, payload, response);
    return response;
  }
}

export const trainingService = new TrainingService();
