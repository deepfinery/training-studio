import { ObjectId } from 'mongodb';
import { getCollection } from '../config/database';
import { UserProfile } from '../types/profile';

type ProfileDocument = UserProfile & { _id?: ObjectId };

function normalize(doc: ProfileDocument): UserProfile {
  const { _id, ...rest } = doc;
  return rest;
}

function withTimestamps(userId: string, values: Partial<UserProfile> & { email?: string }): UserProfile {
  const now = new Date().toISOString();
  return {
    userId,
    email: values.email ?? '',
    name: values.name,
    role: values.role,
    company: values.company,
    phone: values.phone,
    createdAt: values.createdAt ?? now,
    updatedAt: now
  };
}

export class ProfileService {
  private memory = new Map<string, UserProfile>();

  private async collection() {
    try {
      return await getCollection<ProfileDocument>('profiles');
    } catch {
      return null;
    }
  }

  async getProfile(userId: string, defaults: { email: string; name?: string }): Promise<UserProfile> {
    const collection = await this.collection();
    if (collection) {
      const doc = await collection.findOne({ userId });
      if (doc) {
        return normalize(doc);
      }
      const profile = withTimestamps(userId, { ...defaults });
      await collection.insertOne(profile);
      return profile;
    }

    const existing = this.memory.get(userId);
    if (existing) return existing;

    const profile = withTimestamps(userId, { ...defaults });
    this.memory.set(userId, profile);
    return profile;
  }

  async updateProfile(
    userId: string,
    email: string,
    updates: Partial<Omit<UserProfile, 'userId' | 'createdAt' | 'email'>>
  ) {
    const collection = await this.collection();
    const now = new Date().toISOString();

    if (collection) {
      const doc = await collection.findOne({ userId });
      const base = doc ? normalize(doc) : await this.getProfile(userId, { email });
      const updated: UserProfile = {
        ...base,
        ...updates,
        email,
        updatedAt: now
      };
      await collection.updateOne({ userId }, { $set: updated }, { upsert: true });
      return updated;
    }

    const base = this.memory.get(userId) ?? withTimestamps(userId, { email });
    const updated: UserProfile = {
      ...base,
      ...updates,
      email,
      updatedAt: now
    };
    this.memory.set(userId, updated);
    return updated;
  }

  async getProfiles(userIds: string[]): Promise<UserProfile[]> {
    const ids = Array.from(new Set(userIds.filter(Boolean)));
    if (ids.length === 0) {
      return [];
    }

    const collection = await this.collection();
    if (collection) {
      const docs = await collection.find({ userId: { $in: ids } }).toArray();
      return docs.map(normalize);
    }

    return ids
      .map(id => this.memory.get(id))
      .filter((profile): profile is UserProfile => Boolean(profile));
  }
}

export const profileService = new ProfileService();
