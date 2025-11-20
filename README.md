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
1. Install dependencies (Node 20+ recommended).
2. From the repository root run `npm install` to install workspace dependencies.
3. Backend: `npm run dev:backend` starts the Express server with hot reload.
4. Frontend: `npm run dev:frontend` starts the Next.js dashboard on `http://localhost:3000`.
5. Create a `.env` file in each app (see `.env.example` placeholders) before connecting to AWS / Cognito.

## Scripts
| Script | Description |
| --- | --- |
| `npm run dev:backend` | Run backend in watch mode via ts-node-dev. |
| `npm run dev:frontend` | Start the Next.js dev server. |
| `npm run build:backend` | Type-check + compile backend to `dist`. |
| `npm run build:frontend` | Build the Next.js app for production. |
| `npm run lint` | Run linting across workspaces (TBD). |

## Environment Files
- `.env` (root) holds shared values for Docker/infra (`AWS_REGION`, `S3_DATA_BUCKET`, `COGNITO_USER_POOL_ID`, etc.).
- `apps/backend/.env.example` documents runtime secrets for the API server.
- `apps/frontend/.env.example` surfaces `NEXT_PUBLIC_*` vars the dashboard consumes at build-time.
Copy these templates, fill in Cognito + S3 identifiers (or rely on Terraform outputs), and never commit your actual `.env` files.

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
