# ─────────────────────────────────────
# NestJS Backend — Multi-stage Dockerfile
# Stage 1: Cài dependencies + Build TypeScript
# Stage 2: Chạy production (chỉ giữ dist + node_modules prod)
# ─────────────────────────────────────

# === Stage 1: Build ===
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files trước — tận dụng Docker cache layer
COPY package.json package-lock.json* ./

# Cài tất cả dependencies (bao gồm devDependencies cho build)
RUN npm install

# Copy toàn bộ source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript → JavaScript
RUN npm run build

# === Stage 2: Production ===
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Chỉ cài production dependencies (không cần devDependencies)
RUN npm install --omit=dev

# Copy Prisma schema + generated client từ builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Copy dist (compiled JS) từ builder
COPY --from=builder /app/dist ./dist

# Copy email templates (Handlebars) - Commented out until they exist
# COPY --from=builder /app/src/modules/notifications/templates ./dist/modules/notifications/templates

# Copy RSA keys nếu có (JWT RS256)
# Lưu ý: Trong production, nên dùng secrets management thay vì copy file
COPY --from=builder /app/keys ./keys

# Mở port ứng dụng
EXPOSE 4000

# Biến môi trường mặc định

ENV NODE_ENV=production
ENV APP_PORT=4000


# Kiểm tra sức khỏe — tự động restart nếu fail
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://localhost:4000/api/v1/health || exit 1

CMD ["node", "dist/src/main"]
