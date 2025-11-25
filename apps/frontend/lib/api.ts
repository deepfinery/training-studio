export type TrainingMethod = 'qlora' | 'lora' | 'full' | 'new-transformer';

export interface TrainerJobSpec {
  baseModel: {
    provider: 'huggingface' | 'meta' | 'nemo';
    modelName: string;
    revision?: string;
    authToken?: string;
    weightsUrl?: string | null;
  };
  customization: {
    method: string;
    rank?: number;
    targetModules?: string[];
    loraAlpha?: number;
    loraDropout?: number;
    trainableLayers?: string[];
    precision?: string;
    qlora?: Record<string, unknown>;
    peft?: { use: boolean; config?: Record<string, unknown> };
  };
  resources: {
    gpus: number;
    gpuType?: string;
    cpus?: number;
    memoryGb?: number;
    maxDurationMinutes?: number;
  };
  datasets: Array<{
    source: string;
    format: string;
    auth?: Record<string, string>;
  }>;
  artifacts: {
    logUri?: string;
    statusStreamUrl?: string;
    outputUri?: string;
    auth?: Record<string, string>;
  };
  tuningParameters?: Record<string, unknown>;
  callbacks?: {
    webhookUrl?: string;
    authHeader?: string;
  };
}

export interface BillingRecord {
  source: 'promo-credit' | 'customer-free-tier' | 'managed-free-tier' | 'card';
  amountUsd: number;
  currency: string;
  promoCreditsUsed?: number;
  chargeId?: string;
  recordedAt: string;
}

export interface TrainingJobStatusEntry {
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  at: string;
  message?: string;
}

export interface TrainingJob {
  id: string;
  name?: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  method: TrainingMethod;
  datasetUri: string;
  outputUri: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  clusterId: string;
  clusterName: string;
  clusterProvider: 'huggingface' | 'meta' | 'nemo';
  clusterKind: 'managed' | 'customer';
  billing?: BillingRecord;
  jobSpec: TrainerJobSpec;
  statusHistory: TrainingJobStatusEntry[];
  logs?: string[];
}

export type FileKind = 'ingestion' | 'training-input' | 'training-output' | 'evaluation';
export interface FileRecord {
  id?: string;
  userId?: string;
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

export interface IngestionRecord {
  id?: string;
  name: string;
  description?: string;
  sourceType: string;
  status?: string;
  fileKey: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  slug: string;
  description?: string;
  archived?: boolean;
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
  name?: string;
  clusterId: string;
  projectId: string;
  spec: TrainerJobSpec;
}

export async function createJob(body: CreateJobInput) {
  const res = await fetch(apiUrl('/api/training'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse<TrainingJob>(res);
}

export async function cancelTrainingJob(jobId: string) {
  const res = await fetch(apiUrl(`/api/training/${jobId}/cancel`), {
    method: 'POST',
    headers: { ...authHeaders() }
  });
  return parseResponse<TrainingJob>(res);
}

export async function deleteTrainingJob(jobId: string) {
  const res = await fetch(apiUrl(`/api/training/${jobId}`), {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Unable to delete job');
  }
}

export async function requestUpload(body: {
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
}) {
  const res = await fetch(apiUrl('/api/files/presign'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse<{ uploadUrl: string; key: string; bucket: string }>(res);
}

export async function completeUpload(body: {
  key: string;
  size?: number;
  contentType?: string;
  jobId?: string;
  projectId: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
}) {
  const res = await fetch(apiUrl('/api/files/complete'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse(res);
}

export async function initiateMultipartUpload(body: {
  fileName: string;
  size: number;
  projectId: string;
  kind: FileKind;
  contentType?: string;
  jobId?: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
}) {
  const res = await fetch(apiUrl('/api/files/multipart/initiate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse<{ uploadId: string; key: string; bucket: string; partSize: number }>(res);
}

export async function signMultipartPart(body: { uploadId: string; projectId: string; key: string; partNumber: number }) {
  const res = await fetch(apiUrl('/api/files/multipart/sign-part'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse<{ url: string }>(res);
}

export async function completeMultipartUpload(body: {
  uploadId: string;
  key: string;
  projectId: string;
  parts: Array<{ partNumber: number; etag: string }>;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  size?: number;
  contentType?: string;
}) {
  const res = await fetch(apiUrl('/api/files/multipart/complete'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse<FileRecord>(res);
}

export async function abortMultipartUpload(body: { uploadId: string; key: string; projectId: string }) {
  await fetch(apiUrl('/api/files/multipart/abort'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
}

export async function deleteFile(fileId: string) {
  const res = await fetch(apiUrl(`/api/files/${fileId}`), {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
  return parseResponse<{ file: FileRecord }>(res);
}

export async function fetchFiles(kind: FileKind | undefined, projectId: string): Promise<FileRecord[]> {
  if (!projectId) {
    throw new Error('projectId is required to fetch files');
  }
  const params = new URLSearchParams({ projectId });
  if (kind) params.set('kind', kind);
  const res = await fetch(apiUrl(`/api/files?${params.toString()}`), { headers: { ...authHeaders() }, cache: 'no-store' });
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

export interface OrgMemberSummary {
  id: string;
  userId: string;
  role: 'admin' | 'standard';
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
}

export async function recordEvaluation(body: { jobId?: string; fileKey?: string; score?: number; label?: string; notes?: string }) {
  const res = await fetch(apiUrl('/api/evaluations'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse(res);
}

export async function fetchHistory(
  projectId: string
): Promise<{ jobs: TrainingJob[]; files: FileRecord[]; evaluations: EvaluationRecord[] }> {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  const res = await fetch(apiUrl(`/api/history?projectId=${encodeURIComponent(projectId)}`), {
    headers: { ...authHeaders() },
    cache: 'no-store'
  });
  return parseResponse(res);
}

export async function fetchIngestions(): Promise<IngestionRecord[]> {
  const res = await fetch(apiUrl('/api/ingestions'), { headers: { ...authHeaders() }, cache: 'no-store' });
  const payload = await parseResponse<{ ingestions: IngestionRecord[] }>(res);
  return payload.ingestions ?? [];
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

export async function fetchProfile(): Promise<UserProfile & { role?: string }> {
  const res = await fetch(apiUrl('/api/profile'), { headers: { ...authHeaders() }, cache: 'no-store' });
  const payload = await parseResponse<{ profile: UserProfile; role?: string }>(res);
  return { ...payload.profile, role: payload.role };
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

export interface ClusterSummary {
  id: string;
  name: string;
  provider: 'huggingface' | 'meta' | 'nemo';
  apiBaseUrl: string;
  kind: 'managed' | 'customer';
  requiresPayment: boolean;
  ownedBy: 'platform' | 'customer';
  locked?: boolean;
  tokenPreview?: string;
  metadata?: {
    gpuType?: string;
    region?: string;
    authHeaderName?: string;
    s3Region?: string;
    hasS3Credentials?: boolean;
  };
}

export async function fetchClusters(): Promise<ClusterSummary[]> {
  const res = await fetch(apiUrl('/api/clusters'), { headers: { ...authHeaders() }, cache: 'no-store' });
  const payload = await parseResponse<{ clusters: ClusterSummary[] }>(res);
  return payload.clusters ?? [];
}

export async function createClusterRequest(body: {
  name: string;
  provider: ClusterSummary['provider'];
  apiBaseUrl: string;
  apiToken: string;
  authHeaderName?: string;
  gpuType?: string;
  region?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3SessionToken?: string;
  s3Region?: string;
}) {
  const res = await fetch(apiUrl('/api/clusters'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse<{ cluster: ClusterSummary }>(res);
}

export async function updateClusterRequest(
  clusterId: string,
  body: Partial<{
    name: string;
    provider: ClusterSummary['provider'];
    apiBaseUrl: string;
    apiToken: string;
    authHeaderName?: string;
    gpuType?: string;
    region?: string;
    s3AccessKeyId?: string;
    s3SecretAccessKey?: string;
    s3SessionToken?: string;
    s3Region?: string;
  }>
) {
  const res = await fetch(apiUrl(`/api/clusters/${clusterId}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse<{ cluster: ClusterSummary }>(res);
}

export async function deleteCluster(clusterId: string) {
  const res = await fetch(apiUrl(`/api/clusters/${clusterId}`), {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Unable to delete cluster');
  }
}

export interface OrgContext {
  org?: {
    id: string;
    name: string;
    slug: string;
    defaultClusterId?: string;
    promoCredits: number;
    freeJobsConsumed: number;
  };
  membership?: {
    role: 'admin' | 'standard';
  };
  isGlobalAdmin: boolean;
}

export async function fetchOrgContext(): Promise<OrgContext> {
  const res = await fetch(apiUrl('/api/org/context'), { headers: { ...authHeaders() }, cache: 'no-store' });
  return parseResponse<OrgContext>(res);
}

export async function fetchOrgMembers(): Promise<OrgMemberSummary[]> {
  const res = await fetch(apiUrl('/api/org/members'), { headers: { ...authHeaders() }, cache: 'no-store' });
  const payload = await parseResponse<{ members: OrgMemberSummary[] }>(res);
  return payload.members ?? [];
}

export async function fetchProjects(): Promise<ProjectRecord[]> {
  const res = await fetch(apiUrl('/api/projects'), { headers: { ...authHeaders() }, cache: 'no-store' });
  const payload = await parseResponse<{ projects: ProjectRecord[] }>(res);
  return payload.projects ?? [];
}

export async function createProject(body: { name: string }): Promise<ProjectRecord> {
  const res = await fetch(apiUrl('/api/projects'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  const payload = await parseResponse<{ project: ProjectRecord }>(res);
  return payload.project;
}

export async function deleteProject(projectId: string): Promise<ProjectRecord> {
  const res = await fetch(apiUrl(`/api/projects/${projectId}`), {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
  const payload = await parseResponse<{ project: ProjectRecord }>(res);
  return payload.project;
}

export async function setDefaultCluster(clusterId: string) {
  const res = await fetch(apiUrl('/api/org/default-cluster'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ clusterId })
  });
  return parseResponse<{ org: OrgContext['org'] }>(res);
}

export async function updateOrgProfile(body: { name?: string; slug?: string }) {
  const res = await fetch(apiUrl('/api/org/profile'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  return parseResponse<{ org: OrgContext['org'] }>(res);
}

export interface BillingOverview {
  promoCredits: number;
  freeJobsRemaining: number;
  paymentMethods: Array<{
    id: string;
    brand?: string | null;
    last4?: string | null;
    expMonth?: number | null;
    expYear?: number | null;
    isDefault?: boolean;
  }>;
  defaultPaymentMethodId?: string;
  requiresPaymentMethod: boolean;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export async function fetchBillingOverview(): Promise<BillingOverview> {
  const res = await fetch(apiUrl('/api/billing/overview'), { headers: { ...authHeaders() }, cache: 'no-store' });
  return parseResponse<BillingOverview>(res);
}

export async function createSetupIntent() {
  const res = await fetch(apiUrl('/api/billing/setup-intent'), {
    method: 'POST',
    headers: { ...authHeaders() }
  });
  return parseResponse<{ clientSecret: string }>(res);
}

export async function attachPaymentMethod(paymentMethodId: string, makeDefault = true) {
  const res = await fetch(apiUrl('/api/billing/attach'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ paymentMethodId, makeDefault })
  });
  return parseResponse<BillingOverview>(res);
}

export async function setDefaultPaymentMethod(paymentMethodId: string) {
  const res = await fetch(apiUrl('/api/billing/default'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ paymentMethodId })
  });
  return parseResponse<BillingOverview>(res);
}

export async function removePaymentMethod(paymentMethodId: string) {
  const res = await fetch(apiUrl(`/api/billing/payment-methods/${paymentMethodId}`), {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
  return parseResponse<BillingOverview>(res);
}

export async function updateBillingAddress(address: BillingOverview['address']) {
  const res = await fetch(apiUrl('/api/billing/address'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(address)
  });
  return parseResponse<BillingOverview>(res);
}

export async function applyPromoCode(code: string) {
  const res = await fetch(apiUrl('/api/billing/promo'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ code })
  });
  return parseResponse<{ promoCredits: number }>(res);
}
