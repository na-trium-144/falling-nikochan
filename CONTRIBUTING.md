# Contributing to Falling Nikochan

Thank you for your interest in contributing!

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/en/download) >=20.x (>=23.6 required for `pnpm run test`)
- [pnpm](https://pnpm.io/installation) >=10
- [MongoDB](https://www.mongodb.com/docs/manual/installation/) running on `localhost:27017`
  - Required for running the backend and tests. Not required if you are only working on the frontend.
  - Falling Nikochan creates and uses a database named `nikochan`.
  - If Docker is available, you can start MongoDB easily with:
    ```sh
    docker run --rm -p 27017:27017 -d mongodb/mongodb-community-server:latest
    ```
    or equivalently:
    ```sh
    pnpm run mongo-docker
    ```

### Environment Variables

Create a `.env` file in the repository root with the following contents:

```sh
MONGODB_URI="mongodb://localhost:27017"
BACKEND_PREFIX="http://localhost:8787"
API_ENV="development"
API_NO_RATELIMIT="1"
```

Other optional environment variables:

| Variable | Location | Description |
|---|---|---|
| `SECRET_SALT` | backend | string |
| `VERCEL_PROTECTION_BYPASS_SECRET` | backend | string |
| `API_CACHE_EDGE` | backend | `1` or unset |
| `ASSET_PREFIX` | backend & frontend | `https://domain-of-your-assets` or unset |
| `BACKEND_PREFIX` | backend & frontend | `https://domain-of-your-backend` or unset — needed when the page origin differs from the backend origin |
| `BACKEND_OG_PREFIX` | backend | alternate backend for OG image generation; used by Cloudflare Worker entrypoint only |
| `BACKEND_ALT_PREFIX` | frontend | fallback backend URL used when the primary backend returns 5xx |
| `NO_PREFETCH` | frontend | `1` or unset |
| `YOUTUBE_API_KEY` | backend | API key for YouTube Data API v3 (optional) |
| `ALLOW_FETCH_ERROR` | frontend | `1` or unset |
| `VERSION_SUFFIX` | frontend | string |
| `TITLE_SUFFIX` | frontend | string |
| `TWITTER_API_KEY`, `TWITTER_API_KEY_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`, `GEMINI_API_KEY`, `DISCORD_WEBHOOK_ID`, `DISCORD_WEBHOOK_TOKEN` | cronjob | — |

### Install Dependencies

```sh
pnpm install
```

### Seed the Database

```sh
pnpm run seed
```

This inserts a sample chart at cid `102399` ("Get Started!").

### Common Files (`chart/`)

The `chart/` directory contains chart data schemas and conversion logic shared between the frontend and backend.

The frontend does not import `.ts` files from `chart/` directly; it uses the compiled `.js` files. After modifying files in `chart/`, run:

```sh
pnpm run t
```

To watch for changes and recompile automatically during development:

```sh
pnpm run cdev
```

The compiled files are also regenerated automatically when building the frontend or before running tests.

### Backend

The backend serves `/api`, `/share`, `/og`, and `/` (redirect). It is built with [Hono](https://hono.dev/) and can run on multiple runtimes.

> **Note:** The actual backend source code lives in the [`route/`](route/) directory, **not** in [`api/`](api/). The `api/` directory is only the Vercel entrypoint.

For local development, start the Node.js server at `http://localhost:8787`:

```sh
pnpm run ldev
```

Deployment entrypoints:

| File | Runtime |
|---|---|
| `route/serve-local.ts` | Node.js (local dev) |
| `route/serve-bun-prod.ts` | Bun |
| `route/serve-cf.js` | Cloudflare Worker |
| `api/index.js` | Vercel |
| `worker/entry.ts` | Service Worker (partial — redirects etc.) |

When adding new API paths, you may also need to update the `rewrites` in [`vercel.json`](vercel.json).

### Frontend

Start the Next.js development server (hot-reload) at `http://localhost:3000/ja` or `/en`:

```sh
pnpm run ndev
```

> `http://localhost:3000/` returns 404. Always use `/ja` or `/en`.

Or build and export the static HTML (no hot-reload; all pages are served via `http://localhost:8787` after building):

```sh
pnpm run nbuild
```

> **Note:** The `/share/[cid]` page is special. It works by having the Hono backend rewrite the exported placeholder HTML at runtime. It does **not** work in the `pnpm run ndev` development environment. Use `/{ja,en}/share/placeholder` for the placeholder page during development.

### Service Worker

Build both the frontend and the service worker, then access via the backend:

```sh
pnpm run nbuild && pnpm run swbuild
```

The service worker ([`worker/entry.ts`](worker/entry.ts), bundled into `/sw.js`) caches all static assets and pages (except `/api` and `/og`). It updates the cache whenever `/buildVer.json` changes.

## Project Structure & Conventions

### Common Logic (`chart/`)

- Valibot schemas are defined as **functions** (e.g., `export const FooSchema = () => v.object(...)`). This is intentional: lazy evaluation avoids circular reference errors. Follow this pattern when adding new schemas.

### Backend

- Input validation and OpenAPI type definitions use [Valibot](https://valibot.dev/).
- There are five entrypoints (see table above). When making backend changes, make sure all relevant entrypoints are updated.

### Frontend

- All frontend source code is under `frontend/app/[locale]/` — literally `[locale]`, not `ja` or `en` (Next.js dynamic route).
- The `@/...` path alias resolves to `app/[locale]/`.
- Import extensions (none, `.js`, `.jsx`) are mixed in the codebase. All work fine; new code can use any style.
- Icons: use [icon-park](https://github.com/bytedance/IconPark). Import as:
  ```ts
  import IconName from "@icon-park/react/lib/icons/IconName";
  ```
- CSS: [TailwindCSS](https://tailwindcss.com/).
  - Custom theme variables: `app/[locale]/globals.css`
  - Custom utility classes: `styles/utilities.css`
  - When the same styles are repeated, extract them into a Tailwind component in a `styles/*.css` file. Custom component names start with `fn-`.
  - This project uses custom breakpoints such as `main-wide:` instead of standard `md:` or `lg:`.

### Localization (i18n)

- Language resources are in `i18n/[locale]/`.
- When adding or changing UI text, follow [next-intl](https://next-intl.dev/docs/usage/messages) conventions and keep all locales in sync.

## Issues and Pull Requests

- There is no strict issue or PR template. Commit message format and branch naming are flexible.
- For large new features, consider opening an issue or draft PR first to discuss.
  - Large feature proposals are reviewed carefully and may not always be accepted.
- In most cases, open PRs against the `main` branch.
  - Maintainers may sometimes ask you to retarget a PR to the `staging` branch.

## Before Opening a PR

Please run the following checks:

1. **Format** — run Prettier on all code:
   ```sh
   pnpm run format
   ```

2. **Lint** — verify there are no type or lint errors (warnings are acceptable):
   ```sh
   pnpm run lint
   ```

3. **Test** — if you have changed `chart/` or backend code, and MongoDB is available:
   ```sh
   pnpm run test
   ```

## Deployment Notes (for maintainers)

### Vercel

- Set `NODEJS_HELPERS=0`. See [honojs/hono#1256](https://github.com/honojs/hono/issues/1256).
- Set `ENABLE_EXPERIMENTAL_COREPACK=1`. See [Vercel docs](https://vercel.com/docs/builds/configure-a-build#corepack).
- Run `pnpm config set node-linker hoisted --local` before installing dependencies (otherwise Vercel cannot resolve packages in workspaces).

### Cloudflare Worker

- Access to MongoDB from a Cloudflare Worker is unstable for some reason.
- Currently, API requests with a hostname that exactly matches `nikochan.utcode.net` are passed to the origin server before being processed by the Worker.

### Reverse Proxy

- Falling Nikochan uses the **rightmost** value of `x-forwarded-for` for rate limiting. Avoid adding the IP address to `x-forwarded-for` multiple times when going through two or more proxy servers.
