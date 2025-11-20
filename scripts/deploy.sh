#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TF_DIR="$ROOT_DIR/infra/terraform"
ENV_FILE="$ROOT_DIR/.env"
SSH_USER=${DEPLOYMENT_SSH_USER:-ubuntu}

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

REMOTE_DEPLOY_PATH=${REMOTE_DEPLOY_PATH:-/opt/deepfinery}
SSH_KEY=${DEPLOYMENT_SSH_PRIVATE_KEY:-}

if [[ -z "$SSH_KEY" ]]; then
  echo "DEPLOYMENT_SSH_PRIVATE_KEY is not set. Update .env or export it before running this script." >&2
  exit 1
fi

log() {
  printf "[deploy] %s\n" "$1"
}

log "Initializing Terraform state..."
terraform -chdir="$TF_DIR" init -upgrade
log "Applying Terraform (this may take a few minutes)..."
terraform -chdir="$TF_DIR" apply -auto-approve "$@"

PUBLIC_IP=$(terraform -chdir="$TF_DIR" output -raw app_public_ip)
DATA_BUCKET=$(terraform -chdir="$TF_DIR" output -raw s3_data_bucket)
MODEL_BUCKET=$(terraform -chdir="$TF_DIR" output -raw s3_model_bucket)
COGNITO_POOL=$(terraform -chdir="$TF_DIR" output -raw cognito_user_pool_id)
COGNITO_CLIENT=$(terraform -chdir="$TF_DIR" output -raw cognito_client_id)

cat <<INFO
Terraform outputs:
  • Frontend/Backend host IP: $PUBLIC_IP
  • Dataset bucket: $DATA_BUCKET
  • Model bucket: $MODEL_BUCKET
  • Cognito User Pool ID: $COGNITO_POOL
  • Cognito Client ID: $COGNITO_CLIENT
INFO

log "Syncing repository to remote host..."
RSYNC_EXCLUDES=(
  "--exclude=.git"
  "--exclude=node_modules"
  "--exclude=.terraform"
  "--exclude=infra/terraform/.terraform"
  "--exclude=.DS_Store"
)

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$PUBLIC_IP" "mkdir -p $REMOTE_DEPLOY_PATH"
rsync -az --delete "${RSYNC_EXCLUDES[@]}" -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" "$ROOT_DIR/" "$SSH_USER@$PUBLIC_IP:$REMOTE_DEPLOY_PATH"

log "Starting docker compose on the remote host..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$PUBLIC_IP" <<'REMOTE'
cd $REMOTE_DEPLOY_PATH
sudo docker compose down || true
sudo docker compose up -d --build
REMOTE

log "Deployment complete. Backend: http://$PUBLIC_IP:4000  Frontend: http://$PUBLIC_IP:3000"
