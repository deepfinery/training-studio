import { BillingRecord } from './billing';
import { ClusterKind, ClusterProvider } from './cluster';

export type TrainingMethod = 'qlora' | 'lora' | 'full' | 'new-transformer';

export interface TrainerBaseModel {
  provider: ClusterProvider;
  modelName: string;
  revision?: string;
  authToken?: string;
  huggingfaceToken?: string;
  weightsUrl?: string | null;
}

export interface TrainerCustomization {
  method: TrainingMethod | string;
  rank?: number;
  targetModules?: string[];
  loraAlpha?: number;
  loraDropout?: number;
  trainableLayers?: string[];
  precision?: string;
  qlora?: Record<string, unknown>;
  peft?: { use: boolean; config?: Record<string, unknown> };
}

export interface TrainerResources {
  gpus: number;
  gpuType?: string;
  cpus?: number;
  memoryGb?: number;
  maxDurationMinutes?: number;
}

export interface TrainerDataset {
  source: string;
  format: string;
  auth?: Record<string, string>;
}

export interface TrainerArtifacts {
  logUri?: string;
  statusStreamUrl?: string;
  outputUri?: string;
  auth?: Record<string, string>;
}

export interface TrainerCallbacks {
  webhookUrl?: string;
  authHeader?: string;
}

export interface TrainerJobSpec {
  jobId?: string;
  baseModel: TrainerBaseModel;
  customization: TrainerCustomization;
  resources: TrainerResources;
  datasets: TrainerDataset[];
  artifacts: TrainerArtifacts;
  tuningParameters?: Record<string, unknown>;
  callbacks?: TrainerCallbacks;
}

export interface TrainingJobStatusEntry {
  status: TrainingJob['status'];
  at: string;
  message?: string;
}

export interface TrainingJob {
  id: string;
  orgId: string;
  userId: string;
  projectId?: string;
  name?: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  method: TrainingMethod;
  datasetUri: string;
  datasetKey?: string;
  outputUri: string;
  evaluationScore?: number;
  jobSpec: TrainerJobSpec;
  clusterId: string;
  clusterName: string;
  clusterProvider: ClusterProvider;
  clusterKind: ClusterKind;
  callbackToken?: string;
  billing?: BillingRecord;
  statusHistory: TrainingJobStatusEntry[];
  createdAt: string;
  updatedAt: string;
  logs?: string[];
  externalPayload?: Record<string, unknown>;
}

export interface TrainingJobRequest {
  name?: string;
  clusterId: string;
  projectId: string;
  spec: TrainerJobSpec;
}
