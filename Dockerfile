# Stage 1: Builder
# This stage installs dependencies, builds the application, and uses build-time secrets.
FROM node:20-slim AS builder

WORKDIR /app

# Pass build arguments
ARG MONGODB_URI
ARG ASSET_PREFIX=""
ARG NO_PREFETCH=""
ARG BACKEND_ALT_PREFIX=""
ARG ALLOW_FETCH_ERROR=""

# Copy package management files
COPY package.json package-lock.json ./
COPY chart/package.json ./chart/
COPY frontend/package.json ./frontend/
COPY i18n/package.json ./i18n/
COPY route/package.json ./route/
COPY worker/package.json ./worker/

# Install dependencies using npm ci
RUN npm ci --ignore-scripts

# Copy the rest of the source code
COPY . .

# Set environment variables for the build process
ENV MONGODB_URI=${MONGODB_URI}
ENV ASSET_PREFIX=${ASSET_PREFIX}
ENV NO_PREFETCH=${NO_PREFETCH}
ENV BACKEND_ALT_PREFIX=${BACKEND_ALT_PREFIX}

RUN apt-get update && apt-get install -y git

# Run the build commands
RUN npm run t && npm run nbuild && npm run swbuild

# Prune dev dependencies for a smaller node_modules in the final image
RUN npm prune --production

# Stage 2: Production
# This stage creates the final, lean image for runtime.
FROM oven/bun:1-slim AS production

WORKDIR /app

# Copy necessary files from the builder stage
# This includes build outputs, production node_modules, and runtime code.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/route ./route
COPY --from=builder /app/frontend/out ./frontend/out
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/chart ./chart
COPY --from=builder /app/i18n ./i18n

# The server will be started by docker-compose, but we can define a default command.
CMD ["bun", "./route/serve-bun-prod.ts"]
