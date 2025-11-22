export type TrainingMethod = 'qlora' | 'lora' | 'full' | 'new-transformer';

export interface TrainingHyperparams {
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
}

export interface TrainingJob {
  id: string;
  userId: string;
  name?: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  method: TrainingMethod;
  datasetUri: string;
  datasetKey?: string;
  outputUri: string;
  outputBucket?: string;
  evaluationScore?: number;
  hyperparams: TrainingHyperparams;
  createdAt: string;
  updatedAt: string;
  logs?: string[];
}

export interface TrainingJobRequest {
  datasetUri: string;
  datasetKey?: string;
  method: TrainingMethod;
  hyperparams: TrainingHyperparams;
  outputUri?: string;
  outputBucket?: string;
  name?: string;
}
