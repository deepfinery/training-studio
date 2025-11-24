import { ObjectId } from 'mongodb';
import { v4 as uuid } from 'uuid';
import { getCollection } from '../config/database';
import { env } from '../config/env';
import { AuthenticatedUser } from '../types/auth';
import { Org, OrgContext, OrgMembership, OrgRole } from '../types/org';
import { clusterService } from './clusterService';

type OrgDocument = Org & { _id?: ObjectId };
type MembershipDocument = OrgMembership & { _id?: ObjectId };

function normalizeOrg(doc: OrgDocument): Org {
  const { _id, ...rest } = doc;
  return { ...rest, id: rest.id ?? _id?.toString() ?? uuid() };
}

function normalizeMembership(doc: MembershipDocument): OrgMembership {
  const { _id, ...rest } = doc;
  return { ...rest, id: rest.id ?? _id?.toString() ?? uuid() };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
}

class OrgService {
  private globalAdmins = new Set(
    (env.GLOBAL_ADMIN_IDS ?? '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean)
  );

  private async orgsCollection() {
    return getCollection<OrgDocument>('orgs');
  }

  private async membershipsCollection() {
    return getCollection<MembershipDocument>('memberships');
  }

  isGlobalAdmin(userId?: string | null): boolean {
    if (!userId) return false;
    return this.globalAdmins.has(userId);
  }

  private async createOrgForUser(user: AuthenticatedUser): Promise<OrgContext> {
    const orgs = await this.orgsCollection();
    const now = new Date().toISOString();
    const baseName = user.name ?? user.email?.split('@')[0] ?? 'Workspace';
    const org: Org = {
      id: uuid(),
      name: `${baseName}'s Org`,
      slug: slugify(`${baseName}-${Date.now()}`) || slugify(`org-${Date.now()}`),
      promoCredits: 0,
      freeJobsConsumed: 0,
      createdAt: now,
      updatedAt: now
    };
    await orgs.insertOne(org);

    const memberships = await this.membershipsCollection();
    const membership: OrgMembership = {
      id: uuid(),
      orgId: org.id,
      userId: user.id,
      role: 'admin',
      createdAt: now,
      updatedAt: now
    };
    await memberships.insertOne(membership);

    const defaultCluster = await clusterService.ensureDefaultCluster(org);
    if (defaultCluster) {
      org.defaultClusterId = defaultCluster.id;
      await this.updateOrg(org.id, { defaultClusterId: defaultCluster.id });
    }

    return {
      org: { ...org, defaultClusterId: defaultCluster?.id ?? org.defaultClusterId },
      membership,
      isGlobalAdmin: this.isGlobalAdmin(user.id)
    };
  }

  async resolveForUser(user: AuthenticatedUser): Promise<OrgContext> {
    const memberships = await this.membershipsCollection();
    const membershipDoc = await memberships.findOne({ userId: user.id });

    if (!membershipDoc) {
      return this.createOrgForUser(user);
    }

    const membership = normalizeMembership(membershipDoc);
    const org = await this.loadOrg(membership.orgId);
    if (!org) {
      return this.createOrgForUser(user);
    }

    return { org, membership, isGlobalAdmin: this.isGlobalAdmin(user.id) };
  }

  async loadOrg(orgId: string): Promise<Org | null> {
    const orgs = await this.orgsCollection();
    const doc = await orgs.findOne({ id: orgId });
    return doc ? normalizeOrg(doc) : null;
  }

  async updateOrg(orgId: string, patch: Partial<Org>): Promise<Org> {
    const orgs = await this.orgsCollection();
    const now = new Date().toISOString();
    await orgs.updateOne({ id: orgId }, { $set: { ...patch, updatedAt: now } });
    const doc = await orgs.findOne({ id: orgId });
    if (!doc) {
      throw new Error('Org not found');
    }
    return normalizeOrg(doc);
  }

  async adjustPromoCredits(orgId: string, delta: number): Promise<Org> {
    const orgs = await this.orgsCollection();
    const now = new Date().toISOString();
    await orgs.updateOne(
      { id: orgId },
      {
        $inc: { promoCredits: delta },
        $set: { updatedAt: now }
      }
    );
    const doc = await orgs.findOne({ id: orgId });
    if (!doc) throw new Error('Org not found');
    const normalized = normalizeOrg(doc);
    normalized.promoCredits = Math.max(0, normalized.promoCredits);
    await orgs.updateOne({ id: orgId }, { $set: { promoCredits: normalized.promoCredits } });
    return normalized;
  }

  async incrementFreeJobs(orgId: string, delta: number): Promise<Org> {
    const orgs = await this.orgsCollection();
    const now = new Date().toISOString();
    await orgs.updateOne(
      { id: orgId },
      {
        $inc: { freeJobsConsumed: delta },
        $set: { updatedAt: now }
      }
    );
    const doc = await orgs.findOne({ id: orgId });
    if (!doc) throw new Error('Org not found');
    return normalizeOrg(doc);
  }

  async updateDefaultCluster(orgId: string, clusterId: string) {
    await this.updateOrg(orgId, { defaultClusterId: clusterId });
  }
}

export const orgService = new OrgService();
