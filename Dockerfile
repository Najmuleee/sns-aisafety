# Multi-stage build for PFIP

# Stage 1: Build frontend
FROM node:22-alpine AS frontend_builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY client ./client
COPY drizzle ./drizzle
COPY shared ./shared
RUN pnpm run build

# Stage 2: Build backend
FROM node:22-alpine AS backend_builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY server ./server
COPY drizzle ./drizzle
COPY shared ./shared
RUN pnpm run check && pnpm run build

# Stage 3: Runtime
FROM node:22-alpine
WORKDIR /app

# Install Python and face processing dependencies
RUN apk add --no-cache python3 py3-pip build-base python3-dev
RUN pip3 install --no-cache-dir opencv-python onnxruntime numpy pillow faiss-cpu scikit-image

# Copy built artifacts
COPY --from=frontend_builder /app/dist/client ./client/dist
COPY --from=backend_builder /app/dist ./dist
COPY --from=backend_builder /app/node_modules ./node_modules
COPY --from=backend_builder /app/package.json ./package.json
COPY server/services ./server/services

# Copy environment and config files
COPY .env.example .env
COPY drizzle ./drizzle

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "dist/index.js"]
