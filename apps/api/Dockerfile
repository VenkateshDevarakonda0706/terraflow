# Stage 1: Build dependency assets
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source and build
COPY . .
RUN pnpm --filter @terraflow/database db:generate || true
RUN pnpm --filter @terraflow/api build || true

# Stage 2: Prune runtime dependencies
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist || true
COPY --from=builder /app/packages/database/dist ./packages/database/dist || true
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma || true

EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "apps/api/dist/main.js"]
