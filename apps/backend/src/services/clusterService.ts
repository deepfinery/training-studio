import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { getCollection } from '../config/database';
import { env } from '../config/env';
import { Cluster } from '../types/cluster';
import { Org } from '../types/org';

export interface CreateClusterInput {
  name: string;
  provider: Cluster['provider'];
  apiBaseUrl: string;
  apiToken?: string;
  requiresPayment: boolean;
  kind: Cluster['kind'];
  ownedBy: Cluster['ownedBy'];
  freeJobLimit?: number;
  metadata?: Cluster['metadata'];
  locked?: boolean;
}

type ClusterDocument = Cluster & { _id?: ObjectId };

function normalizeCluster(doc: ClusterDocument): Cluster {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: rest.id ?? _id?.toString() ?? uuid(),
    tokenPreview: rest.apiToken ? `${rest.apiToken.slice(0, 4)}…${rest.apiToken.slice(-4)}` : undefined
  };
}

class ClusterService {
  private async collection() {
    return getCollection<ClusterDocument>('clusters');
  }

  async list(orgId: string): Promise<Cluster[]> {
    const collection = await this.collection();
    const docs = await collection.find({ orgId }).sort({ createdAt: -1 }).toArray();
    return docs.map(normalizeCluster);
  }

  async get(orgId: string, clusterId: string): Promise<Cluster | null> {
    const collection = await this.collection();
    const doc = await collection.findOne({ orgId, id: clusterId });
    return doc ? normalizeCluster(doc) : null;
  }

  async findById(clusterId: string): Promise<Cluster | null> {
    const collection = await this.collection();
    const doc = await collection.findOne({ id: clusterId });
    return doc ? normalizeCluster(doc) : null;
  }

  async create(orgId: string, input: CreateClusterInput): Promise<Cluster> {
    const collection = await this.collection();
    const now = new Date().toISOString();
    const cluster: Cluster = {
      id: uuid(),
      orgId,
      name: input.name,
      provider: input.provider,
      apiBaseUrl: input.apiBaseUrl.replace(/\/+$/, ''),
      apiToken: input.apiToken,
      kind: input.kind,
      requiresPayment: input.requiresPayment,
      ownedBy: input.ownedBy,
      freeJobLimit: input.freeJobLimit,
      metadata: input.metadata,
      locked: input.locked ?? false,
      createdAt: now,
      updatedAt: now
    };
    await collection.insertOne(cluster);
    return normalizeCluster(cluster);
  }

  async update(orgId: string, clusterId: string, patch: Partial<CreateClusterInput>): Promise<Cluster> {
    const collection = await this.collection();
    const now = new Date().toISOString();
    const updates: Partial<Cluster> = {
      ...(patch.name ? { name: patch.name } : {}),
      ...(patch.provider ? { provider: patch.provider } : {}),
      ...(patch.apiBaseUrl ? { apiBaseUrl: patch.apiBaseUrl.replace(/\/+$/, '') } : {}),
      ...(patch.apiToken !== undefined ? { apiToken: patch.apiToken } : {}),
      ...(patch.requiresPayment !== undefined ? { requiresPayment: patch.requiresPayment } : {}),
      ...(patch.kind ? { kind: patch.kind } : {}),
      ...(patch.ownedBy ? { ownedBy: patch.ownedBy } : {}),
      ...(patch.freeJobLimit !== undefined ? { freeJobLimit: patch.freeJobLimit } : {}),
      ...(patch.metadata ? { metadata: patch.metadata } : {}),
      updatedAt: now
    };

    await collection.updateOne({ orgId, id: clusterId }, { $set: updates });
    const doc = await collection.findOne({ orgId, id: clusterId });
    if (!doc) throw new Error('Cluster not found');
    return normalizeCluster(doc);
  }

  async ensureDefaultCluster(org: Org): Promise<Cluster | null> {
    const collection = await this.collection();
    const existing = await collection.findOne({ orgId: org.id, ownedBy: 'platform' });
    if (existing) {
      return normalizeCluster(existing);
    }

    if (!env.DEFAULT_MANAGED_CLUSTER_URL) return null;

    const cluster = await this.create(org.id, {
      name: 'deepfinery-cluster',
      provider: env.DEFAULT_MANAGED_CLUSTER_PROVIDER,
      apiBaseUrl: env.DEFAULT_MANAGED_CLUSTER_URL,
      apiToken: env.DEFAULT_MANAGED_CLUSTER_TOKEN || undefined,
      requiresPayment: true,
      kind: 'managed',
      ownedBy: 'platform',
      freeJobLimit: 0,
      locked: true,
      metadata: {
        gpuType: 'A100',
        region: 'us-west-2'
      }
    });

    return cluster;
  }
}

export const clusterService = new ClusterService();
