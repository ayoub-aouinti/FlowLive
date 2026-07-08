# ── Stage 1: Build the React/Vite frontend ───────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL is baked in at build time.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Run the Express server ───────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy server package configuration and install production-only dependencies
COPY server/package*.json ./server/
RUN npm ci --omit=dev --prefix server

# Copy server codebase
COPY server/ ./server/

# Copy the frontend built assets to the public folder inside server/
COPY --from=builder /app/dist ./server/public

EXPOSE 5001

ENV PORT=5001
ENV NODE_ENV=production

# Start the Express/Socket.io backend which also serves the frontend
CMD ["node", "server/index.js"]
