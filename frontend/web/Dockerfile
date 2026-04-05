# ─────────────────────────────────────
# Next.js 16 Frontend — Multi-stage Dockerfile
# Stage 1: Install dependencies
# Stage 2: Build Next.js
# Stage 3: Production runner (standalone output)
# ─────────────────────────────────────

# === Stage 1: Dependencies ===
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files — leverage Docker cache layer
COPY web/package.json web/package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# === Stage 2: Build ===
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source code
COPY web/ ./

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

# === Stage 3: Production Runner ===
FROM node:20-alpine AS runner

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy i18n messages
COPY --from=builder /app/messages ./messages

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]
