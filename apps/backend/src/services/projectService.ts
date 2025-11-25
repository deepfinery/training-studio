import { PutObjectCommand } from '@aws-sdk/client-s3';
import { ObjectId } from 'mongodb';
import { getCollection } from '../config/database';
import { env } from '../config/env';
import { ProjectRecord } from '../types/projects';
import { s3 } from './s3Client';

type ProjectDocument = ProjectRecord & { _id?: ObjectId };

const MAX_PROJECTS_PER_USER = 50;

export class ProjectServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalize(doc: ProjectDocument): ProjectRecord {
  const { _id, ...rest } = doc;
  return { ...rest, id: doc.id ?? _id?.toString() };
}

function cleanName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || `project-${Date.now()}`;
}

async function ensureUniqueSlug(userId: string, base: string) {
  const collection = await getCollection<ProjectDocument>('projects');
  let slug = base;
  let counter = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await collection.findOne({ userId, slug })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

async function putPlaceholder(key: string) {
  if (!env.S3_DATA_BUCKET) return;
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.S3_DATA_BUCKET,
        Key: key,
        Body: '',
        ContentType: 'application/octet-stream'
      })
    );
  } catch (error) {
    console.warn('Unable to create S3 placeholder', error);
  }
}

async function ensureUserStorageNamespace(userId: string) {
  await putPlaceholder(`users/${userId}/.keep`);
}

async function ensureProjectStorageNamespace(userId: string, projectId: string) {
  await ensureUserStorageNamespace(userId);
  await putPlaceholder(`users/${userId}/projects/${projectId}/.keep`);
}

export async function listProjects(userId: string) {
  const collection = await getCollection<ProjectDocument>('projects');
  const docs = await collection.find({ userId }).sort({ createdAt: 1 }).toArray();
  return docs.map(normalize);
}

export async function getProject(userId: string, projectId: string) {
  if (!ObjectId.isValid(projectId)) return null;
  const collection = await getCollection<ProjectDocument>('projects');
  const doc = await collection.findOne({ _id: new ObjectId(projectId), userId });
  return doc ? normalize(doc) : null;
}

export async function createProject(userId: string, rawName: string) {
  const collection = await getCollection<ProjectDocument>('projects');
  const name = cleanName(rawName);
  if (!name) {
    throw new ProjectServiceError('Project name is required');
  }

  const activeCount = await collection.countDocuments({ userId, archived: { $ne: true } });
  if (activeCount >= MAX_PROJECTS_PER_USER) {
    throw new ProjectServiceError('Project limit reached. Remove a project before creating a new one.', 400);
  }

  const baseSlug = slugify(name);
  const slug = await ensureUniqueSlug(userId, baseSlug);
  const now = new Date().toISOString();
  const doc: ProjectDocument = {
    userId,
    name,
    slug,
    createdAt: now,
    updatedAt: now
  };

  const result = await collection.insertOne(doc);
  const project = normalize({ ...doc, _id: result.insertedId });
  await ensureProjectStorageNamespace(userId, project.id!);
  return project;
}

export async function deleteProject(userId: string, projectId: string) {
  if (!ObjectId.isValid(projectId)) {
    throw new ProjectServiceError('Invalid project id', 404);
  }
  const collection = await getCollection<ProjectDocument>('projects');
  const result = await collection.findOneAndDelete({ _id: new ObjectId(projectId), userId });
  if (!result.value) {
    throw new ProjectServiceError('Project not found', 404);
  }
  return normalize(result.value);
}
