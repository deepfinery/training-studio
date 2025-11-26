import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  UploadPartCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ObjectId } from 'mongodb';
import { env } from '../config/env';
import { getCollection } from '../config/database';
import { FileKind, FileRecord } from '../types/files';
import { getProject } from './projectService';
import { s3 } from './s3Client';

function sanitizeFileName(name: string) {
  return name.replace(/[^a-z0-9_.-]/gi, '-').toLowerCase();
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
const DEFAULT_PART_SIZE_BYTES = 10 * 1024 * 1024; // 10MB chunks

function toRecord(doc: (FileRecord & { _id?: ObjectId }) | null): FileRecord | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { ...rest, id: rest.id ?? _id?.toString() };
}

function buildKey(userId: string, projectId: string, kind: FileKind, fileName: string) {
  return `users/${userId}/projects/${projectId}/${kind}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

function normalizeTags(tags?: string[]) {
  if (!Array.isArray(tags)) return undefined;
  const unique = Array.from(
    new Set(
      tags
        .map(tag => tag?.trim())
        .filter((tag): tag is string => Boolean(tag))
        .map(tag => tag!.slice(0, 50))
    )
  );
  return unique.length ? unique : undefined;
}

function baseRecord({
  userId,
  projectId,
  key,
  bucket,
  fileName,
  kind,
  contentType,
  size,
  jobId,
  description,
  title,
  category,
  tags,
  uploadId,
  partSize
}: {
  userId: string;
  projectId: string;
  key: string;
  bucket: string;
  fileName: string;
  kind: FileKind;
  contentType?: string;
  size: number;
  jobId?: string;
  description?: string;
  title?: string;
  category?: string;
  tags?: string[];
  uploadId?: string;
  partSize?: number;
}): FileRecord {
  const now = new Date().toISOString();
  return {
    userId,
    projectId,
    key,
    bucket,
    kind,
    status: 'pending',
    originalName: fileName,
    contentType,
    jobId,
    size,
    title,
    description,
    category,
    tags: normalizeTags(tags),
    uploadId,
    partSize,
    createdAt: now,
    updatedAt: now
  };
}

export async function createPresignedUpload(
  userId: string,
  params: {
    fileName: string;
    contentType?: string;
    kind: FileKind;
    jobId?: string;
    projectId: string;
    size: number;
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
  }
) {
  if (!params.projectId) {
    throw new Error('A project is required for uploads');
  }
  if (!Number.isFinite(params.size) || params.size <= 0) {
    throw new Error('File size is required for uploads');
  }
  if (params.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Upload exceeds the 2GB limit');
  }

  const project = await getProject(userId, params.projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const key = buildKey(userId, project.id!, params.kind, params.fileName);
  const bucket = env.S3_DATA_BUCKET;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: params.contentType ?? 'application/octet-stream'
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

  const collection = await getCollection<FileRecord>('files');
  await collection.insertOne(
    baseRecord({
      userId,
      projectId: project.id!,
      key,
      bucket,
      kind: params.kind,
      fileName: params.fileName,
      contentType: params.contentType,
      size: params.size,
      jobId: params.jobId,
      title: params.title ?? params.fileName,
      description: params.description,
      category: params.category,
      tags: params.tags
    })
  );

  return { uploadUrl, key, bucket };
}

export async function initiateMultipartUpload(
  userId: string,
  params: {
    fileName: string;
    size: number;
    contentType?: string;
    kind: FileKind;
    projectId: string;
    jobId?: string;
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
  }
) {
  if (!params.projectId) {
    throw new Error('A project is required for uploads');
  }
  if (!Number.isFinite(params.size) || params.size <= 0) {
    throw new Error('File size is required for uploads');
  }
  if (params.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Upload exceeds the 2GB limit');
  }

  const project = await getProject(userId, params.projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const key = buildKey(userId, project.id!, params.kind, params.fileName);
  const bucket = env.S3_DATA_BUCKET;

  const command = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: params.contentType ?? 'application/octet-stream',
    Metadata: {
      projectId: project.id!,
      userId
    }
  });

  const response = await s3.send(command);
  if (!response.UploadId) {
    throw new Error('Unable to start multipart upload');
  }

  const collection = await getCollection<FileRecord>('files');
  await collection.insertOne(
    baseRecord({
      userId,
      projectId: project.id!,
      key,
      bucket,
      kind: params.kind,
      fileName: params.fileName,
      contentType: params.contentType,
      size: params.size,
      jobId: params.jobId,
      title: params.title ?? params.fileName,
      description: params.description,
      category: params.category,
      tags: params.tags,
      uploadId: response.UploadId,
      partSize: DEFAULT_PART_SIZE_BYTES
    })
  );

  return {
    key,
    bucket,
    uploadId: response.UploadId,
    partSize: DEFAULT_PART_SIZE_BYTES
  };
}

export async function signMultipartUploadPart(userId: string, projectId: string, key: string, uploadId: string, partNumber: number) {
  if (partNumber < 1) {
    throw new Error('Invalid part number');
  }
  const collection = await getCollection<FileRecord>('files');
  const record = await collection.findOne({ userId, projectId, key, uploadId });
  if (!record) {
    throw new Error('Upload session not found');
  }

  const command = new UploadPartCommand({
    Bucket: record.bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 900 });
  return { url };
}

export async function completeMultipartUploadSession(
  userId: string,
  projectId: string,
  key: string,
  uploadId: string,
  parts: Array<{ partNumber: number; etag: string }>,
  metadata?: Partial<Pick<FileRecord, 'description' | 'title' | 'category' | 'tags' | 'size' | 'contentType'>>
) {
  if (!parts || parts.length === 0) {
    throw new Error('Parts are required to complete upload');
  }

  const collection = await getCollection<FileRecord>('files');
  const record = await collection.findOne({ userId, projectId, key, uploadId });
  if (!record) {
    throw new Error('Upload record not found');
  }

  const sortedParts = parts
    .map(part => ({ ETag: part.etag.replace(/"/g, ''), PartNumber: part.partNumber }))
    .sort((a, b) => a.PartNumber - b.PartNumber);

  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: record.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts
      }
    })
  );

  const now = new Date().toISOString();
  await collection.updateOne(
    { userId, projectId, key, uploadId },
    {
      $set: {
        ...metadata,
        status: 'uploaded',
        tags: normalizeTags(metadata?.tags ?? record.tags),
        updatedAt: now
      },
      $unset: { uploadId: '' }
    }
  );

  const doc = await collection.findOne({ userId, projectId, key });
  return toRecord(doc);
}

export async function abortMultipartUpload(userId: string, projectId: string, key: string, uploadId: string) {
  const collection = await getCollection<FileRecord>('files');
  const record = await collection.findOne({ userId, projectId, key, uploadId });
  if (!record) {
    return;
  }

  await s3.send(
    new AbortMultipartUploadCommand({
      Bucket: record.bucket,
      Key: key,
      UploadId: uploadId
    })
  );

  await collection.deleteOne({ userId, projectId, key, uploadId });
}

export async function completeUpload(userId: string, key: string, projectId: string, metadata: Partial<FileRecord>) {
  if (metadata.size && metadata.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Uploaded file exceeds the 2GB limit');
  }

  const collection = await getCollection<FileRecord>('files');
  const now = new Date().toISOString();
  const filter = { userId, key, projectId };
  const result = await collection.updateOne(filter, {
    $set: {
      ...metadata,
      status: 'uploaded',
      updatedAt: now
    }
  });

  if (result.matchedCount === 0) {
    throw new Error('Upload record not found for this project');
  }

  const doc = await collection.findOne(filter);
  return toRecord(doc);
}

export async function listFiles(userId: string, projectId: string, kind?: FileKind) {
  if (!projectId) {
    throw new Error('projectId is required to list files');
  }
  const collection = await getCollection<FileRecord>('files');
  const cursor = collection
    .find({ userId, projectId, ...(kind ? { kind } : {}) })
    .sort({ createdAt: -1 })
    .limit(50);
  const docs = await cursor.toArray();
  return docs.map(doc => toRecord(doc)!);
}

export async function deleteFile(userId: string, fileId: string) {
  if (!ObjectId.isValid(fileId)) {
    throw new Error('Invalid file id');
  }
  const collection = await getCollection<FileRecord>('files');
  const record = await collection.findOne({ _id: new ObjectId(fileId), userId });
  if (!record) {
    throw new Error('File not found');
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: record.bucket,
      Key: record.key
    })
  );

  await collection.deleteOne({ _id: new ObjectId(fileId), userId });
  return toRecord(record as FileRecord);
}

export async function deleteFilesForProject(userId: string, projectId: string) {
  const collection = await getCollection<FileRecord>('files');
  const files = await collection.find({ userId, projectId }).toArray();
  if (files.length === 0) return;

  const grouped = files.reduce<Record<string, string[]>>((acc, file) => {
    acc[file.bucket] = acc[file.bucket] ?? [];
    acc[file.bucket].push(file.key);
    return acc;
  }, {});

  await Promise.all(
    Object.entries(grouped).map(async ([bucket, keys]) => {
      for (let i = 0; i < keys.length; i += 1000) {
        const chunk = keys.slice(i, i + 1000).map(key => ({ Key: key }));
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: chunk }
          })
        );
      }
    })
  );

  await collection.deleteMany({ userId, projectId });
}

export async function listTrainingResults(userId: string, projectId: string) {
  if (!env.S3_DATA_BUCKET) {
    throw new Error('S3 data bucket not configured');
  }
  const prefix = `users/${userId}/projects/${projectId}/results/`;
  const command = new ListObjectsV2Command({
    Bucket: env.S3_DATA_BUCKET,
    Prefix: prefix
  });
  const response = await s3.send(command);
  const contents = response.Contents ?? [];
  const files = contents.filter(item => item.Key && !item.Key.endsWith('/'));
  const mapped = await Promise.all(
    files.map(async item => {
      const key = item.Key!;
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: env.S3_DATA_BUCKET,
          Key: key
        }),
        { expiresIn: 900 }
      );
      return {
        key,
        size: item.Size ?? 0,
        lastModified:
          item.LastModified instanceof Date
            ? item.LastModified.toISOString()
            : typeof item.LastModified === 'string'
              ? item.LastModified
              : undefined,
        downloadUrl: url
      };
    })
  );
  return mapped;
}
