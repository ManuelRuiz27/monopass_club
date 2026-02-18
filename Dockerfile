FROM node:22-bookworm-slim

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY core-api/package.json core-api/package.json
COPY scanner-service/package.json scanner-service/package.json
COPY frontend/package.json frontend/package.json
COPY landing/package.json landing/package.json

RUN npm ci --workspaces --include-workspace-root

COPY . .

# Prisma generate does not need a live DB connection, but it expects DATABASE_URL to exist.
ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/monopass?schema=public
RUN npm run prisma:generate -w core-api
