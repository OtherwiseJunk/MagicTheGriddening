#!/bin/bash
set -e

E2E_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Stopping e2e database..."
docker compose -f "$E2E_DIR/docker-compose.e2e.yml" down -v

echo "E2E database stopped."
