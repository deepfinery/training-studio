export interface EvaluationRecord {
  id?: string;
  userId: string;
  jobId?: string;
  fileKey?: string;
  label?: string;
  score?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
