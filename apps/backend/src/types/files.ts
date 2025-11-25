export type FileKind = 'ingestion' | 'training-input' | 'training-output' | 'evaluation';

export interface FileRecord {
  id?: string;
  userId: string;
  projectId: string;
  key: string;
  bucket: string;
  kind: FileKind;
  status: 'pending' | 'uploaded';
  originalName: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  contentType?: string;
  size?: number;
  jobId?: string;
  checksum?: string;
  uploadId?: string;
  partSize?: number;
  createdAt: string;
  updatedAt: string;
}
