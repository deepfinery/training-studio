import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ObjectId } from 'mongodb';
import { env } from '../config/env';
import { getCollection } from '../config/database';
import { FileKind, FileRecord } from '../types/files';

const s3 = new S3Client({ region: env.AWS_REGION });

function sanitizeFileName(name: string) {
  return name.replace(/[^a-z0-9_.-]/gi, '-').toLowerCase();
}

function toRecord(doc: (FileRecord & { _id?: ObjectId }) | null): FileRecord | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { ...rest, id: rest.id ?? _id?.toString() };
}

export async function createPresignedUpload(
  userId: string,
  params: { fileName: string; contentType?: string; kind: FileKind; jobId?: string }
) {
  const key = `${userId}/${params.kind}/${Date.now()}-${sanitizeFileName(params.fileName)}`;
  const bucket = env.S3_DATA_BUCKET;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: params.contentType ?? 'application/octet-stream'
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

  const now = new Date().toISOString();
  const collection = await getCollection<FileRecord>('files');
  await collection.insertOne({
    userId,
    key,
    bucket,
    kind: params.kind,
    status: 'pending',
    originalName: params.fileName,
    contentType: params.contentType,
    jobId: params.jobId,
    createdAt: now,
    updatedAt: now
  });

  return { uploadUrl, key, bucket };
}

export async function completeUpload(userId: string, key: string, metadata: Partial<FileRecord>) {
  const collection = await getCollection<FileRecord>('files');
  const now = new Date().toISOString();
  await collection.updateOne(
    { userId, key },
    {
      $set: {
        ...metadata,
        status: 'uploaded',
        updatedAt: now
      }
    }
  );

  const doc = await collection.findOne({ userId, key });
  return toRecord(doc);
}

export async function listFiles(userId: string, kind?: FileKind) {
  const collection = await getCollection<FileRecord>('files');
  const cursor = collection
    .find({ userId, ...(kind ? { kind } : {}) })
    .sort({ createdAt: -1 })
    .limit(50);
  const docs = await cursor.toArray();
  return docs.map(doc => toRecord(doc)!);
}
