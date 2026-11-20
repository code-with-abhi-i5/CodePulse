# Development & Production image for the NestJS API
FROM node:20-slim

# Install system dependencies with security hardening & clear apt cache
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci || npm install

# Copy application source code
COPY . .

# Generate Prisma Client and configure non-root ownership
RUN npx prisma generate \
    && chown -R node:node /app

# Enforce least-privilege non-root container execution
USER node
EXPOSE 3001
CMD ["sh", "scripts/docker-dev-entrypoint.sh"]
