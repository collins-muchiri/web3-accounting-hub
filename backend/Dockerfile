# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Build stage: full dependencies (incl. dev tooling) -> compiled dist/
# ---------------------------------------------------------------------------
FROM node:20.18-alpine3.20 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---------------------------------------------------------------------------
# Runtime stage: production deps + built artifacts only, runs as non-root
# ---------------------------------------------------------------------------
FROM node:20.18-alpine3.20 AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Never run as root in containers handling financial data.
USER node

# Production dependencies come from the pruned builder's node_modules;
# this keeps the layer small and avoids a second network install here.
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node package.json ./

EXPOSE 4000

# Basic liveness check so orchestrators can detect crash loops early.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

# Start the COMPILED application — not a watch-mode dev server.
CMD ["node", "dist/main"]