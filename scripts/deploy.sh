#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
SSH_USER=${DEPLOYMENT_SSH_USER:-ubuntu}
SSH_HOST=${DEPLOYMENT_HOST:-}
SSH_PORT=${DEPLOYMENT_SSH_PORT:-22}

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

REMOTE_DEPLOY_PATH=${REMOTE_DEPLOY_PATH:-/opt/deepfinery}
SSH_KEY=${DEPLOYMENT_SSH_PRIVATE_KEY:-}

if [[ -z "$SSH_KEY" || -z "$SSH_HOST" ]]; then
  echo "DEPLOYMENT_SSH_PRIVATE_KEY and DEPLOYMENT_HOST must be set. Update .env or export them before running this script." >&2
  exit 1
fi

log() {
  printf "[deploy] %s\n" "$1"
}

log "Syncing repository to remote host..."
RSYNC_EXCLUDES=(
  "--exclude=.git"
  "--exclude=node_modules"
  "--exclude=.terraform"
  "--exclude=.DS_Store"
)

ssh -i "$SSH_KEY" -p "$SSH_PORT" -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "mkdir -p $REMOTE_DEPLOY_PATH"
rsync -az --delete "${RSYNC_EXCLUDES[@]}" -e "ssh -i $SSH_KEY -p $SSH_PORT -o StrictHostKeyChecking=no" "$ROOT_DIR/" "$SSH_USER@$SSH_HOST:$REMOTE_DEPLOY_PATH"

log "Starting docker compose on the remote host..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" <<REMOTE
cd $REMOTE_DEPLOY_PATH
sudo docker compose down || true
sudo docker compose up -d --build
REMOTE

log "Deployment complete. Backend: http://$SSH_HOST:4000  Frontend: http://$SSH_HOST:3000"
