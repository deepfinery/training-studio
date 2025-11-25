export type ClusterProvider = 'nemo' | 'meta' | 'huggingface';
export type ClusterKind = 'managed' | 'customer';

export interface Cluster {
  id: string;
  orgId: string;
  name: string;
  provider: ClusterProvider;
  apiBaseUrl: string;
  apiToken?: string;
  tokenPreview?: string;
  kind: ClusterKind;
  requiresPayment: boolean;
  ownedBy: 'platform' | 'customer';
  freeJobLimit?: number;
  locked?: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    gpuType?: string;
    region?: string;
    authHeaderName?: string;
    s3AccessKeyId?: string;
    s3SecretAccessKey?: string;
    s3SessionToken?: string;
    s3Region?: string;
  };
}
