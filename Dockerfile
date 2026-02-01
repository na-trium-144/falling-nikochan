FROM node:20-slim AS builder

WORKDIR /app
ENV CI=true

# Install pnpm
RUN npm install -g pnpm@10

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY chart/package.json ./chart/
COPY frontend/package.json ./frontend/
COPY i18n/package.json ./i18n/
COPY route/package.json ./route/
COPY worker/package.json ./worker/

RUN pnpm install --frozen-lockfile --ignore-scripts \
    --filter chart \
    --filter i18n \
    --filter route

COPY . .

RUN pnpm run t
# RUN pnpm prune --prod --ignore-scripts
RUN rm -rf node_modules */node_modules && \
    pnpm install --prod --frozen-lockfile --ignore-scripts \
    --filter chart \
    --filter i18n \
    --filter route

FROM oven/bun:1-slim AS production

WORKDIR /app

# Copy necessary files from the builder stage
# This includes build outputs, production node_modules, and runtime code.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/route ./route
COPY --from=builder /app/chart ./chart
COPY --from=builder /app/i18n ./i18n
COPY .vercel/output/static ./frontend/out

# The server will be started by docker-compose, but we can define a default command.
CMD ["bun", "./route/serve-bun-prod.ts"]
