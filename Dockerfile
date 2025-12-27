FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY chart/package.json ./chart/
COPY frontend/package.json ./frontend/
COPY i18n/package.json ./i18n/
COPY route/package.json ./route/
COPY worker/package.json ./worker/

RUN npm ci --ignore-scripts

COPY . .

RUN npm run t && npm prune --production

FROM oven/bun:1-slim AS production

WORKDIR /app

# Copy necessary files from the builder stage
# This includes build outputs, production node_modules, and runtime code.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/route ./route
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/chart ./chart
COPY --from=builder /app/i18n ./i18n
COPY .vercel/output/static ./frontend/out

# The server will be started by docker-compose, but we can define a default command.
CMD ["bun", "./route/serve-bun-prod.ts"]
