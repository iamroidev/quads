# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20 AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci --legacy-peer-deps

COPY src ./src
RUN npm run build

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:20 AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Preserve uploads directory structure (actual files come from cloud storage)
RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/app.js"]