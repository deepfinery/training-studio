export type TrainingMethod = 'qlora' | 'lora' | 'full' | 'new-transformer';

export interface TrainingJob {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  method: TrainingMethod;
  datasetUri: string;
  datasetKey?: string;
  outputUri: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
  evaluationScore?: number;
  hyperparams: {
    baseModel?: string;
    [key: string]: unknown;
  };
  logs?: string[];
}

export type FileKind = 'ingestion' | 'training-input' | 'training-output' | 'evaluation';
export interface FileRecord {
  id?: string;
  userId?: string;
  key: string;
  bucket: string;
  kind: FileKind;
  status: 'pending' | 'uploaded';
  originalName: string;
  contentType?: string;
  size?: number;
  createdAt: string;
  updatedAt: string;
  jobId?: string;
}

export interface EvaluationRecord {
  id?: string;
  userId?: string;
  jobId?: string;
  fileKey?: string;
  label?: string;
  score?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/$/, '');
const apiUrl = (path: string) => `${API_BASE}${path}`;

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('idToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export async function fetchJobs(): Promise<TrainingJob[]> {
  const res = await fetch(apiUrl('/api/training'), {
    cache: 'no-store',
    headers: { ...authHeaders() }
  });
  const payload = await parseResponse<{ jobs: TrainingJob[] }>(res);
  return payload.jobs ?? [];
}

export interface CreateJobInput {
  datasetUri: string;
  datasetKey?: string;
  method: TrainingMethod;
  hyperparams: {
    baseModel: string;
    sequenceLength: number;
    batchSize: number;
    gradientAccumulation: number;
    epochs: number;
    learningRate: number;
    rank?: number;
    alpha?: number;
    dropout?: number;
    packing?: boolean;
  };
  outputUri?: string;
  outputBucket?: string;
  name?: string;
}

export async function createJob(body: CreateJobInput) {
  const res = await fetch(apiUrl('/api/training'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });

  return parseResponse(res);
}

export async function requestUpload(body: { fileName: string; contentType?: string; kind: FileKind; jobId?: string }) {
  const res = await fetch(apiUrl('/api/files/presign'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse<{ uploadUrl: string; key: string; bucket: string }>(res);
}

export async function completeUpload(body: { key: string; size?: number; contentType?: string; jobId?: string }) {
  const res = await fetch(apiUrl('/api/files/complete'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse(res);
}

export async function fetchFiles(kind?: FileKind): Promise<FileRecord[]> {
  const params = kind ? `?kind=${encodeURIComponent(kind)}` : '';
  const res = await fetch(apiUrl(`/api/files${params}`), { headers: { ...authHeaders() }, cache: 'no-store' });
  const payload = await parseResponse<{ files: FileRecord[] }>(res);
  return payload.files ?? [];
}

export async function fetchEvaluations(): Promise<EvaluationRecord[]> {
  const res = await fetch(apiUrl('/api/evaluations'), { headers: { ...authHeaders() }, cache: 'no-store' });
  const payload = await parseResponse<{ evaluations: EvaluationRecord[] }>(res);
  return payload.evaluations ?? [];
}

export interface UserProfile {
  userId: string;
  email: string;
  name?: string;
  role?: string;
  company?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export async function recordEvaluation(body: { jobId?: string; fileKey?: string; score?: number; label?: string; notes?: string }) {
  const res = await fetch(apiUrl('/api/evaluations'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse(res);
}

export async function fetchHistory(): Promise<{ jobs: TrainingJob[]; files: FileRecord[]; evaluations: EvaluationRecord[] }> {
  const res = await fetch(apiUrl('/api/history'), { headers: { ...authHeaders() }, cache: 'no-store' });
  return parseResponse(res);
}

export async function registerAccount(body: { email: string; password: string; name?: string }) {
  const res = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return parseResponse<{ userSub: string; userConfirmed?: boolean }>(res);
}

export async function verifyAccount(body: { email: string; code: string }) {
  const res = await fetch(apiUrl('/api/auth/verify'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return parseResponse<{ verified: boolean }>(res);
}

export interface AuthTokens {
  AccessToken?: string;
  IdToken?: string;
  RefreshToken?: string;
}

export async function login(body: { email: string; password: string }): Promise<AuthTokens> {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return parseResponse<AuthTokens>(res);
}

export async function getGoogleLoginUrl(redirectUri?: string) {
  const params = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : '';
  const res = await fetch(apiUrl(`/api/auth/google${params}`));
  const payload = await parseResponse<{ url: string }>(res);
  return payload.url;
}

export async function exchangeCode(code: string, redirectUri?: string): Promise<AuthTokens> {
  const res = await fetch(apiUrl('/api/auth/exchange'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri })
  });
  return parseResponse<AuthTokens>(res);
}

export async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch(apiUrl('/api/profile'), { headers: { ...authHeaders() }, cache: 'no-store' });
  const payload = await parseResponse<{ profile: UserProfile }>(res);
  return payload.profile;
}

export async function updateProfile(body: Partial<Omit<UserProfile, 'userId' | 'email' | 'createdAt' | 'updatedAt'>>) {
  const res = await fetch(apiUrl('/api/profile'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  const payload = await parseResponse<{ profile: UserProfile }>(res);
  return payload.profile;
}

export async function changePasswordApi(body: { email: string; currentPassword: string; newPassword: string }) {
  const res = await fetch(apiUrl('/api/auth/change-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse<{ updated: boolean }>(res);
}
