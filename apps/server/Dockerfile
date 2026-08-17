# Build stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/server/tsconfig.json apps/server/tsconfig.json
COPY apps/server/src apps/server/src
RUN npm run build --workspace apps/server

# Production stage
FROM node:20-bookworm-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev

COPY --from=builder /app/apps/server/dist apps/server/dist

WORKDIR /app/apps/server

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
