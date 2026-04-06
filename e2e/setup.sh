#!/bin/bash
set -e

E2E_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$E2E_DIR")"
E2E_DB_URL="postgresql://postgres:postgres@localhost:5433/griddening_e2e"

echo "Starting e2e database..."
docker compose -f "$E2E_DIR/docker-compose.e2e.yml" up -d

echo "Waiting for Postgres to be ready..."
until docker exec mtg-e2e-db pg_isready -U postgres > /dev/null 2>&1; do
  sleep 0.5
done

echo "Running Prisma migrations..."
DATABASE_URL="$E2E_DB_URL" npx prisma migrate deploy --schema="$PROJECT_DIR/prisma/schema.prisma"

echo "Seeding test data..."
docker exec -i mtg-e2e-db psql -U postgres -d griddening_e2e < "$E2E_DIR/seed.sql"

echo "E2E database ready."
