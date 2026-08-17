# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/web apps/web
RUN npm run build --workspace apps/web

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY --from=builder /app/apps/web apps/web

WORKDIR /app/apps/web

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5173 || exit 1

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
