# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Build stage: install deps, typecheck + produce static bundle in dist/
# ---------------------------------------------------------------------------
FROM node:20.18-alpine3.20 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig*.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---------------------------------------------------------------------------
# Runtime stage: serve static assets with nginx (NOT the Vite dev server)
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Replace the stock default site with our hardened config.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]