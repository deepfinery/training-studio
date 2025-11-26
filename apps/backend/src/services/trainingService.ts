import { randomBytes } from 'crypto';
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

  private buildS3Auth(cluster: Cluster) {
    const meta = cluster.metadata;
    if (!meta?.s3AccessKeyId || !meta.s3SecretAccessKey) {
      return undefined;
    }
    return {
      aws_access_key_id: meta.s3AccessKeyId,
      aws_secret_access_key: meta.s3SecretAccessKey,
      ...(meta.s3SessionToken ? { aws_session_token: meta.s3SessionToken } : {}),
      aws_region: meta.s3Region ?? env.AWS_REGION
    };
  }

  private buildJobSpec(
    jobId: string,
    spec: TrainerJobSpec,
    cluster: Cluster,
    params: { userId: string; projectId: string; callbackToken: string }
  ) {
    const callbackUrl = `${env.PUBLIC_API_BASE_URL.replace(/\/$/, '')}/api/training/webhooks/${jobId}`;
    const s3Auth = this.buildS3Auth(cluster);
    const datasets = spec.datasets.map(dataset => ({
      ...dataset,
      auth: dataset.auth ?? s3Auth
    }));
    const artifactAuth = spec.artifacts.auth ?? s3Auth;
    const basePrefix = `s3://${env.S3_DATA_BUCKET}/users/${params.userId}/projects/${params.projectId}`;
    const defaultLogUri = `${basePrefix}/logs/${jobId}/`;
    const defaultOutputUri = `${basePrefix}/results/${jobId}/`;
    return {
      ...spec,
      jobId: spec.jobId ?? jobId,
      artifacts: {
        ...spec.artifacts,
        statusStreamUrl: callbackUrl,
        logUri: spec.artifacts.logUri ?? defaultLogUri,
        outputUri: spec.artifacts.outputUri ?? defaultOutputUri,
        ...(artifactAuth ? { auth: artifactAuth } : {})
      },
      callbacks: {
        ...(spec.callbacks ?? {}),
        webhookUrl: callbackUrl,
        authHeader: `Bearer ${params.callbackToken}`
      },
      datasets
    };
  }

  private deriveDatasetUri(spec: TrainerJobSpec) {
    return spec.datasets[0]?.source ?? spec.artifacts.outputUri ?? 's3://unknown-dataset';
  }

  async createJob(params: {
    orgId: string;
    userId: string;
    projectId: string;
    request: TrainingJobRequest;
    cluster: Cluster;
  }): Promise<TrainingJob> {
    const { orgId, userId, projectId, request, cluster } = params;
    const now = new Date().toISOString();
    const jobId = uuid();
    const callbackToken = randomBytes(32).toString('hex');
    const jobSpec = this.buildJobSpec(jobId, request.spec, cluster, { userId, projectId, callbackToken });
    const datasetUri = this.deriveDatasetUri(jobSpec);
    const datasetKey = datasetUri.startsWith('s3://') ? datasetUri.replace(/^s3:\/\/(?:[^/]+)\//, '') : undefined;
    const job: TrainingJob = {
      id: jobId,
      orgId,
      userId,
      projectId,
      name: request.name ?? `${jobSpec.baseModel.modelName} @ ${new Date().toLocaleString()}`,
      status: 'queued',
      method: (jobSpec.customization.method as TrainingJob['method']) ?? 'lora',
      datasetUri,
      datasetKey,
      outputUri: jobSpec.artifacts.outputUri ?? datasetUri,
      jobSpec,
      clusterId: cluster.id,
      clusterName: cluster.name,
      clusterProvider: cluster.provider,
      clusterKind: cluster.kind,
      callbackToken,
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

  async cancelJob(orgId: string, jobId: string, userId: string, role: OrgRole, isGlobalAdmin: boolean) {
    const job = await this.getJob(orgId, jobId, userId, role, isGlobalAdmin);
    if (!job) {
      return undefined;
    }

    return this.mutate(jobId, current => {
      const message = 'Cancelled by workspace user';
      return {
        ...current,
        status: 'cancelled',
        logs: [...(current.logs ?? []), message],
        updatedAt: new Date().toISOString(),
        statusHistory: [
          ...(current.statusHistory ?? []),
          { status: 'cancelled', at: new Date().toISOString(), message }
        ]
      };
    });
  }

  async deleteJob(orgId: string, jobId: string, userId: string, role: OrgRole, isGlobalAdmin: boolean) {
    const job = await this.getJob(orgId, jobId, userId, role, isGlobalAdmin);
    if (!job) {
      return false;
    }

    const collection = await this.jobsCollection();
    if (collection) {
      await collection.deleteOne({ id: jobId });
    } else {
      this.memoryJobs.delete(jobId);
    }
    return true;
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
        output_uri: spec.artifacts.outputUri,
        auth: spec.artifacts.auth
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
      const headerName = cluster.metadata?.authHeaderName?.trim() || 'Authorization';
      if (headerName.toLowerCase() === 'authorization' && !/^bearer\s+/i.test(cluster.apiToken)) {
        headers.Authorization = `Bearer ${cluster.apiToken}`;
      } else {
        headers[headerName] = cluster.apiToken;
      }
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
