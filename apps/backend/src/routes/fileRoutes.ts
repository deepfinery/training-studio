import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authMiddleware';
import {
  abortMultipartUpload,
  completeMultipartUploadSession,
  completeUpload,
  createPresignedUpload,
  deleteFile,
  initiateMultipartUpload,
  listFiles,
  signMultipartUploadPart
} from '../services/storageService';

const router = Router();

router.use(requireAuth);

router.post('/presign', async (req, res) => {
  const schema = z.object({
    fileName: z.string().min(1),
    contentType: z.string().optional(),
    kind: z.enum(['ingestion', 'training-input', 'training-output', 'evaluation']),
    jobId: z.string().optional(),
    projectId: z.string().min(1),
    size: z.number().int().positive(),
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const presign = await createPresignedUpload(req.user!.id, parsed.data);
    res.status(201).json(presign);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to create upload URL' });
  }
});

router.post('/complete', async (req, res) => {
  const schema = z.object({
    key: z.string().min(1),
    size: z.number().int().optional(),
    contentType: z.string().optional(),
    jobId: z.string().optional(),
    checksum: z.string().optional(),
    projectId: z.string().min(1),
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const record = await completeUpload(req.user!.id, parsed.data.key, parsed.data.projectId, parsed.data);
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to record upload' });
  }
});

router.get('/', async (req, res) => {
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : null;
  if (!projectId) {
    return res.status(400).json({ message: 'projectId query parameter is required' });
  }
  const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined;
  try {
    const files = await listFiles(req.user!.id, projectId, kind as any);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to list files' });
  }
});

router.post('/multipart/initiate', async (req, res) => {
  const schema = z.object({
    fileName: z.string().min(1),
    contentType: z.string().optional(),
    kind: z.enum(['ingestion', 'training-input', 'training-output', 'evaluation']),
    projectId: z.string().min(1),
    size: z.number().int().positive(),
    jobId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const session = await initiateMultipartUpload(req.user!.id, parsed.data);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to start multipart upload' });
  }
});

router.post('/multipart/sign-part', async (req, res) => {
  const schema = z.object({
    uploadId: z.string().min(1),
    projectId: z.string().min(1),
    key: z.string().min(1),
    partNumber: z.number().int().positive()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const url = await signMultipartUploadPart(
      req.user!.id,
      parsed.data.projectId,
      parsed.data.key,
      parsed.data.uploadId,
      parsed.data.partNumber
    );
    res.json(url);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to create part URL' });
  }
});

router.post('/multipart/complete', async (req, res) => {
  const schema = z.object({
    uploadId: z.string().min(1),
    key: z.string().min(1),
    projectId: z.string().min(1),
    parts: z
      .array(
        z.object({
          partNumber: z.number().int().positive(),
          etag: z.string().min(1)
        })
      )
      .min(1),
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    size: z.number().int().optional(),
    contentType: z.string().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const record = await completeMultipartUploadSession(
      req.user!.id,
      parsed.data.projectId,
      parsed.data.key,
      parsed.data.uploadId,
      parsed.data.parts,
      {
        title: parsed.data.title,
        description: parsed.data.description,
        tags: parsed.data.tags,
        category: parsed.data.category,
        size: parsed.data.size,
        contentType: parsed.data.contentType
      }
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to complete multipart upload' });
  }
});

router.post('/multipart/abort', async (req, res) => {
  const schema = z.object({
    uploadId: z.string().min(1),
    key: z.string().min(1),
    projectId: z.string().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    await abortMultipartUpload(req.user!.id, parsed.data.projectId, parsed.data.key, parsed.data.uploadId);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to abort upload' });
  }
});

router.delete('/:fileId', async (req, res) => {
  const schema = z.object({
    fileId: z.string().min(1)
  });
  const parsed = schema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid file id' });
  }

  try {
    const record = await deleteFile(req.user!.id, parsed.data.fileId);
    res.json({ file: record });
  } catch (error) {
    res
      .status(error instanceof Error && error.message === 'File not found' ? 404 : 500)
      .json({ message: error instanceof Error ? error.message : 'Unable to delete file' });
  }
});

export default router;
