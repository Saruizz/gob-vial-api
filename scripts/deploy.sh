#!/usr/bin/env bash
# ============================================================
# GoberVial - Script de Despliegue Automatizado
# Ejecutar en el VPS: bash deploy.sh
# ============================================================

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
step() { echo -e "\n${BLUE}[STEP]${NC} $*"; }

APP_DIR="/var/www/gobervial"
API_DIR="${APP_DIR}/api"
APP_DIR_FRONT="${APP_DIR}/app"
BRANCH="${1:-develop}"

step "1/6: Pulling latest code from GitHub (branch: ${BRANCH})"

cd "${API_DIR}"
git fetch origin
git checkout "${BRANCH}"
git pull origin "${BRANCH}"

log "Code updated to latest commit: $(git rev-parse --short HEAD)"

step "2/6: Installing backend dependencies"

cd "${API_DIR}"
npm ci --omit=dev

step "3/6: Building backend"

cd "${API_DIR}"
npm run build 2>/dev/null || npx tsc

step "4/6: Pulling frontend code"

cd "${APP_DIR_FRONT}"
git fetch origin
git checkout "${BRANCH}"
git pull origin "${BRANCH}"

log "Frontend code updated to latest commit: $(git rev-parse --short HEAD)"

step "5/6: Installing frontend dependencies and building"

cd "${APP_DIR_FRONT}"
npm ci
npx ng build --configuration production

step "6/6: Reloading PM2 process"

pm2 reload gobervial-api 2>/dev/null || pm2 start "${API_DIR}/dist/server.js" --name gobervial-api

log "Deploy completed successfully"

echo ""
echo -e "${YELLOW}============================================================${NC}"
echo -e "${GREEN}  GOBERVIAL DEPLOYED - $(date)${NC}"
echo -e "${YELLOW}============================================================${NC}"
echo ""
echo "  Backend  : PM2 process 'gobervial-api'"
echo "  Frontend : ${APP_DIR_FRONT}"
echo "  Logs     : pm2 logs gobervial-api"
echo ""
pm2 status
