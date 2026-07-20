#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env.production ]]; then
  echo "Crie .env.production a partir de .env.production.example"
  exit 1
fi

echo "==> Pull latest code"
git pull origin main

echo "==> Build and start containers"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo "==> Deploy concluído"
echo "    API barbeiro: https://barber.wynext.online"
echo "    PWA cliente:  https://app.wynext.online"
echo "    Health:       https://barber.wynext.online/api/health"
