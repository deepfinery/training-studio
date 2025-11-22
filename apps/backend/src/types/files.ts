export type FileKind = 'ingestion' | 'training-input' | 'training-output' | 'evaluation';

export interface FileRecord {
  id?: string;
  userId: string;
  key: string;
  bucket: string;
  kind: FileKind;
  status: 'pending' | 'uploaded';
  originalName: string;
  contentType?: string;
  size?: number;
  jobId?: string;
  checksum?: string;
  createdAt: string;
  updatedAt: string;
}
