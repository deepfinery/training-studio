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
Follow the quick-starts below to run locally, with Docker, or with Terraform-managed AWS infra.

### Local (no containers)
1) Install dependencies (Node 20+): `npm install`
2) Copy and fill envs  
   - Backend: `cp apps/backend/.env.example apps/backend/.env`  
   - Frontend: `cp apps/frontend/.env.example apps/frontend/.env`  
   Populate Cognito (pool/client/domain/redirect), S3 buckets, and DocumentDB URI. For dev without Cognito, leave `ALLOW_DEV_AUTH=true` in backend `.env`.
3) Run dev servers  
   - Backend: `npm run dev:backend` (port 4000)  
   - Frontend: `npm run dev:frontend` (port 3000, uses `NEXT_PUBLIC_API_BASE`)
4) Production builds  
   - Backend: `npm run build:backend` then `node apps/backend/dist/server.js`  
   - Frontend: `npm run build:frontend` then `npm run start --prefix apps/frontend`

### Docker Compose
1) Ensure root `.env` exists (you can reuse backend/front env values here). Include AWS region, S3 buckets, Cognito IDs/domain/redirect, DocumentDB URI/CA path, `ALLOW_DEV_AUTH` if needed.  
2) Build & run: `docker compose up --build`  
   - Frontend: http://localhost:3000  
   - Backend: http://localhost:4000
3) Build images individually (optional)  
   - Backend: `docker build -f apps/backend/Dockerfile -t training-backend .`  
   - Frontend: `docker build -f apps/frontend/Dockerfile -t training-frontend .`

### Infrastructure (Terraform on AWS)
1) Copy vars: `cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars`
2) Edit `terraform.tfvars` with:
   - `aws_region`, `aws_profile`
   - `s3_data_bucket`, `s3_model_bucket`
   - `cognito_domain_prefix`, `oauth_callback_urls`, `oauth_logout_urls`
   - Google OAuth client id/secret for SSO
   - DocumentDB username/password, instance class/count, port
   - VPC/subnet CIDRs, SSH key name/path, instance type, remote deploy path
3) Apply: from `infra/terraform` run `terraform init && terraform apply`
4) Use outputs to populate envs: `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_DOMAIN`, `COGNITO_REDIRECT_URI`, `S3_DATA_BUCKET`, `S3_MODEL_BUCKET`, `DOCUMENTDB_URI`, `DOCUMENTDB_TLS_CA_FILE`, etc.
5) (Optional) Deploy app to a host: copy repo to the provisioned VM and run `docker compose up -d --build` with the filled `.env`.

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
- `apps/frontend/.env.example` surfaces `NEXT_PUBLIC_*` vars the dashboard consumes at build-time (Cognito domain/redirect for hosted UI/Google SSO).
Copy these templates, fill Cognito + S3 + DocumentDB identifiers (or rely on Terraform outputs), and never commit your actual `.env` files.

## Containerization
- `apps/backend/Dockerfile` packages the Express API (builds TypeScript + prunes dev deps).
- `apps/frontend/Dockerfile` builds the Next.js dashboard with configurable `NEXT_PUBLIC_*` args.
- `docker-compose.yml` runs both containers locally (`docker compose up --build`) with env wiring so the frontend hits `http://backend:4000`.

## Deploying to AWS
1. Customize `infra/terraform/terraform.tfvars` (buckets, region, SSH key, etc.).
2. Ensure `.env` contains `DEPLOYMENT_SSH_PRIVATE_KEY` (path to the key that matches `ssh_key_name`), `REMOTE_DEPLOY_PATH`, and AWS credentials/profile.
3. Execute `scripts/deploy.sh`. The script:
   - Initializes/applies the Terraform stack (S3 buckets, Cognito pool/client, VPC, security group, Ubuntu VM).
   - Streams the Terraform outputs so you can update `.env` with real IDs.
   - Rsyncs the repo to the VM and runs `docker compose up -d --build`, exposing the backend on port `4000` and the dashboard on port `3000`.

## Environment Variables
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: Required for S3 dataset storage and EKS orchestration.
- `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`: Used by both backend (token validation) and frontend (auth flows).
- `HUGGINGFACE_API_TOKEN`: Passed to training jobs for dataset download / model push.
- `GCP_PROJECT`, `GCS_BUCKET`: Optional, for Vertex AI submissions.

## Status
This repository currently contains scaffolding for the backend API service and frontend dashboard. Follow the roadmap above to flesh out ingestion, training orchestration, progress tracking, and serving workflows.
# training-studio
