# DeepFinery Training Studio

DeepFinery is a Business Logic Refinery that turns human-readable rules into deterministic Small Language Models (SLMs). The Training Studio is the UI + backend orchestration layer that lets enterprise teams ingest their documentation, configure fine-tuning jobs (LoRA/QLoRA/full), and deploy the resulting models on CPUs, edge hardware, or containerized vLLM services.

## Repository Structure

```
.
├── apps
│   ├── backend            # Node.js (Express + TypeScript) service that orchestrates training jobs
│   └── frontend           # Next.js dashboard for ingesting rules and managing training runs
├── package.json           # Root workspace definition
└── README.md
```

## Features (roadmap)
- Upload/ingest documentation, PDFs, and legacy rule files into S3.
- Interactive refinement workflow powered by the Agentic Teacher (large model + knowledge graph) to produce ontologies.
- Synthetic data generation pipeline that maps ontologies to AML prompts/responses.
- Configurable SLM training (QLoRA, LoRA, full FT) with sliders for ranks, alphas, gradient settings, schedules, etc.
- Training runners for both local (single GPU) and managed (Vertex) environments.
- Deployment targets: EKS-hosted inference, downloadable container bundle, and S3 artifact storage.
- Usage management (multi-tenant) with Cognito auth, billing hooks, and seat limits.

## Getting Started
Follow the quick-starts below to run locally or with Docker. Infrastructure (Cognito, S3, networking, certificates, etc.) now lives in a separate repo—pull the necessary values from that stack.

### Local (no containers)
1) Install dependencies (Node 20+): `npm install`  
2) Copy and fill envs  
   - Backend: `cp apps/backend/.env.example apps/backend/.env`  
   - Frontend: `cp apps/frontend/.env.example apps/frontend/.env`  
   Use the values from your provisioned AWS resources: Cognito user pool/client with the custom domain (e.g., `https://auth.studio.deepfinery.com`), redirect/logout URIs, S3 buckets, and DocumentDB URI/CA. For dev without Cognito, leave `ALLOW_DEV_AUTH=true` in backend `.env`.
3) Run dev servers  
   - Backend: `npm run dev:backend` (port 4000)  
   - Frontend: `npm run dev:frontend` (port 3000, proxies `/api/*` to the backend defined by `BACKEND_INTERNAL_BASE`)
4) Production builds  
   - Backend: `npm run build:backend` then `node apps/backend/dist/server.js`  
   - Frontend: `npm run build:frontend` then `npm run start --prefix apps/frontend`

### Docker Compose
1) Ensure root `.env` exists (you can reuse backend/front env values here). Include AWS region, S3 buckets, Cognito IDs/custom domain/redirect, DocumentDB URI/CA path, `ALLOW_DEV_AUTH` if needed.  
2) Build & run: `docker compose up --build`  
   - Frontend: http://localhost:3000  
   - Backend: http://localhost:4000
3) Build images individually (optional)  
   - Backend: `docker build -f apps/backend/Dockerfile -t training-backend .`  
   - Frontend: `docker build -f apps/frontend/Dockerfile -t training-frontend .`

### Infrastructure
Infrastructure code now lives outside this repo. The application expects that you already have:
- Cognito User Pool + client + custom domain (e.g., `auth.studio.deepfinery.com`) and matching OAuth callback/logout URLs.
- S3 buckets for datasets and trained models.
- DocumentDB (or Mongo-compatible) database with TLS CA.
- A host/VM with Docker + Docker Compose reachable via SSH where the app will run.

Keep the outputs from your infra repo handy to populate the `.env` files here.

### Using your Terraform outputs (what to do now)
You already have the infra outputs:
```
app_public_ip = 44.215.126.72
cognito_client_id = 2fgl95ajnvgq8k54gka6ei8e2s
cognito_domain = auth.studio.deepfinery.com
cognito_user_pool_id = us-east-1_ta6ULSKzB
docdb_connection_uri = <your_URI>
s3_data_bucket = deepfinery-training-data-123456
s3_model_bucket = deepfinery-trained-models-123456
```

1) Root `.env` (used by Docker Compose + deploy script). Create `.env` with:
```
AWS_REGION=us-east-1
S3_DATA_BUCKET=deepfinery-training-data-123456
S3_MODEL_BUCKET=deepfinery-trained-models-123456
COGNITO_USER_POOL_ID=us-east-1_ta6ULSKzB
COGNITO_CLIENT_ID=2fgl95ajnvgq8k54gka6ei8e2s
COGNITO_DOMAIN=https://auth.studio.deepfinery.com
COGNITO_REDIRECT_URI=https://auth.studio.deepfinery.com/sso/callback
COGNITO_GOOGLE_IDP=Google
DOCUMENTDB_URI=<docdb_connection_uri>
DOCUMENTDB_DB=training-studio
DOCUMENTDB_TLS_CA_FILE=/etc/ssl/certs/rds-ca-bundle.pem
# Deployment target
DEPLOYMENT_HOST=44.215.126.72
DEPLOYMENT_SSH_PRIVATE_KEY=/path/to/your/key.pem
DEPLOYMENT_SSH_USER=ubuntu
DEPLOYMENT_SSH_PORT=22
REMOTE_DEPLOY_PATH=/opt/deepfinery
```
2) Backend env: copy the same values into `apps/backend/.env` (see `apps/backend/.env.example`) and add any app-specific secrets like `HUGGINGFACE_API_TOKEN`.  
3) Frontend env: copy the Cognito settings plus the internal backend base (used by Next.js rewrites) into `apps/frontend/.env` (see `apps/frontend/.env.example`), e.g.:
```
BACKEND_INTERNAL_BASE=http://backend:4000
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_ta6ULSKzB
NEXT_PUBLIC_COGNITO_CLIENT_ID=2fgl95ajnvgq8k54gka6ei8e2s
NEXT_PUBLIC_COGNITO_DOMAIN=https://auth.studio.deepfinery.com
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://auth.studio.deepfinery.com/sso/callback
NEXT_PUBLIC_GOOGLE_IDP=Google
```
Leave `NEXT_PUBLIC_API_BASE` empty to reuse the same origin; set it only if browsers must talk to a public API host directly.
4) Deploy: `./scripts/deploy.sh` (rsyncs to `44.215.126.72` and runs `docker compose up -d --build`).  
5) Verify: Backend at `http://44.215.126.72:4000`, Frontend at `http://44.215.126.72:3000`. Update the protocol/port if you terminate TLS elsewhere.

## Scripts
| Script | Description |
| --- | --- |
| `npm run dev:backend` | Run backend in watch mode via ts-node-dev. |
| `npm run dev:frontend` | Start the Next.js dev server. |
| `npm run build:backend` | Type-check + compile backend to `dist`. |
| `npm run build:frontend` | Build the Next.js app for production. |
| `npm run lint` | Run linting across workspaces (TBD). |

## Environment Files
- `.env` (root, optional) holds shared values for Docker/infra (`AWS_REGION`, `S3_DATA_BUCKET`, `COGNITO_USER_POOL_ID`, `COGNITO_DOMAIN`, `DOCUMENTDB_URI`, etc.).
- `apps/backend/.env.example` documents runtime secrets for the API server (`ALLOW_DEV_AUTH` enables auth bypass locally).
- `apps/frontend/.env.example` surfaces `BACKEND_INTERNAL_BASE` (for server-to-server rewrites) and the `NEXT_PUBLIC_*` vars the dashboard consumes at build-time (Cognito domain/redirect for hosted UI/Google SSO).
Copy these templates, fill Cognito + S3 + DocumentDB identifiers (or rely on Terraform outputs), and never commit your actual `.env` files.

## Containerization
- `apps/backend/Dockerfile` packages the Express API (builds TypeScript + prunes dev deps).
- `apps/frontend/Dockerfile` builds the Next.js dashboard with configurable `NEXT_PUBLIC_*` args.
- `docker-compose.yml` runs both containers locally (`docker compose up --build`) with env wiring so the frontend proxies `/api/*` requests to the `backend` service.

## Deploying to an existing host
1) Prereqs on the target host: Docker + Docker Compose installed, the TLS CA for DocumentDB available if needed, and security groups/firewall opened for ports 3000/4000 (or your chosen overrides).  
2) In this repo, create/update `.env` with your AWS values (region, S3 buckets, Cognito pool/client, custom Cognito domain such as `https://auth.studio.deepfinery.com`, redirect/logout URIs, DocumentDB URI/CA, AWS credentials) plus deployment settings:  
   - `DEPLOYMENT_HOST` (public IP or hostname of the VM)  
   - `DEPLOYMENT_SSH_PRIVATE_KEY` (path to the private key that matches the host)  
   - Optional: `DEPLOYMENT_SSH_USER` (default `ubuntu`), `DEPLOYMENT_SSH_PORT` (default `22`), `REMOTE_DEPLOY_PATH` (default `/opt/deepfinery`)  
3) Run `./scripts/deploy.sh`. The script rsyncs the repo (including `.env`) to the host and runs `docker compose up -d --build` there.  
4) Access the services: Backend `http://<DEPLOYMENT_HOST>:4000`, Frontend `http://<DEPLOYMENT_HOST>:3000`.

## Environment Variables
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: Required for S3 dataset storage and EKS orchestration.
- `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`: Used by both backend (token validation) and frontend (auth flows).
- `HUGGINGFACE_API_TOKEN`: Passed to training jobs for dataset download / model push.
- `GCP_PROJECT`, `GCS_BUCKET`: Optional, for Vertex AI submissions.

## Status
This repository currently contains scaffolding for the backend API service and frontend dashboard. Follow the roadmap above to flesh out ingestion, training orchestration, progress tracking, and serving workflows.
# training-studio
