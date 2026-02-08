FROM node:20-slim AS builder

WORKDIR /app
ENV CI=true

# Install pnpm
RUN npm install -g pnpm@10

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY chart/package.json ./chart/
COPY i18n/package.json ./i18n/
COPY route/package.json ./route/

RUN pnpm install --frozen-lockfile --ignore-scripts \
    --filter chart \
    --filter i18n \
    --filter route

COPY . .

RUN pnpm run t

FROM node:20-slim AS prod-deps

WORKDIR /app
ENV CI=true

# Install pnpm
RUN npm install -g pnpm@10

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY chart/package.json ./chart/
COPY i18n/package.json ./i18n/
COPY route/package.json ./route/

RUN pnpm install --prod --frozen-lockfile --ignore-scripts \
    --filter chart \
    --filter i18n \
    --filter route

COPY . .

FROM oven/bun:1-slim AS production

WORKDIR /app

# Copy necessary files from the builder stage
# This includes build outputs, production node_modules, and runtime code.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package.json ./package.json
COPY --from=prod-deps /app/route ./route
COPY --from=prod-deps /app/chart ./chart
COPY --from=prod-deps /app/i18n ./i18n
COPY --from=builder /app/route/dist ./route/dist
COPY --from=builder /app/chart/dist ./chart/dist
COPY .vercel/output/static ./frontend/out

# The server will be started by docker-compose, but we can define a default command.
CMD ["bun", "./route/serve-bun-prod.ts"]
