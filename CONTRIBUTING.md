# Contributing to Falling Nikochan

Thank you for your interest in contributing!

## Issues

- There are no specific rules for creating issues. Feel free to create issues for questions, bug reports, or feature requests.
- Issues can be in Japanese or English.
- However, please note that we may not always respond positively to feature requests.
  - We can accept pull requests for issues tagged with priority/2 or 3. Issues without a priority tag are less likely to be accepted even if you create a pull request.
- The code may have few comments and a messy structure. Please feel free to ask any questions about the code.

## Pull Requests

- Always create pull requests to the main branch. (Although the maintainer may change the merge target branch to staging or other branches.)
- Enable "Allow edits by maintainers."
- There are no specific rules for branch names or commit messages.
- You don't need to fill in the CHANGELOG or bump version numbers; the maintainer will do that before or after the merge.

### Before Opening a PR

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

## Development Setup, Project Structure

### Prerequisites

- [Node.js](https://nodejs.org/en/download) (>=23.6 required for `pnpm run test`)
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

The frontend does not import `.ts` files from `chart/` directly; it uses the compiled `.js` files.
After modifying files in `chart/`, run:
```sh
pnpm run t
```
To watch for changes and recompile automatically during development:
```sh
pnpm run cdev
```
The compiled files are also regenerated automatically when building the frontend or before running tests.

**Conventions**

- Valibot schemas are defined as **functions** (e.g., `export const FooSchema = () => v.object(...)`). This is intentional: lazy evaluation avoids circular reference errors.
- For frequently used data types, OpenAPI schemas are also defined simultaneously to simplify OpenAPI documentation and registered in docSchema.ts.
- Making changes to the chart data format (`chart/legacy/`) involves a complicated procedure. It is recommended that you do not touch it unless you have a thorough understanding of Falling Nikochan's internal structure.

  <details><summary>When bumping major version</summary>

  * Create new file in `chart/src/legacy/`
      * Parts of the schema that remain unchanged do not need to be duplicated; they can be imported from the previous version.
  * Update `chart/src/index.ts` so it can import the new file in `legacy/`.
  * Update type aliases, currentChartVer, convertToPlay, convertToLatest etc. in `chart/src/chart.ts`
  * In `route/src/api/chart.ts`,
      * Update the ChartEntry and ChartEntryCompressed type to support the new version.
      * Update chartToEntry function to support the last 2 versions.
      * Update entryToChart function to support the new version.
  * Update `route/src/api/chartFile.ts`, `newChartFile.ts`, `playFile.ts` and `seqPreview.ts` to support the last 2 versions, including the OpenAPI documentation (describeRoute).
  * Fix any typecheck and lint errors.
      * Statements like `currentChartVer satisfies 15;` indicates that not only that statement but also the surrounding code needs to be updated when the version changes.
  * Release new version of `fn-commands` library

  </details>

### Backend

The backend is built with Hono and can run on multiple runtimes.
There are five backend entry points:
- `route/serve-local.ts` for Node.js (local development)
- `route/serve-bun-prod.ts` for Bun (production)
- `route/serve-cf.js` for Cloudflare Worker
- `api/index.js` for Vercel
- (`worker/entry.ts` executed by the Service Worker)

If you modify any of these, please update all of them.
When adding new API paths, you may also need to update the `rewrites` in `vercel.json`.

For local development, start the Node.js server at `http://localhost:8787`:
```sh
pnpm run ldev
```

**Conventions**

- When code branches depending on the deployment target, the Hono App creation is made into a function. (`const fooApp = async (config: ...) => new Hono(...)`)
- Error messages use only those included in `i18n/[locale]/error.js`, except for validation errors, and are returned using `throw new HTTPException` or `return c.json()`.

### Frontend

Start the Next.js development server (hot-reload) at `http://localhost:3000/ja` or `/en`:

```sh
pnpm run ndev
```

`http://localhost:3000/` returns 404. Always access `/ja` or `/en`.

To build and export the static HTML:
```sh
pnpm run nbuild
```

**Convention**

- The `@/...` path alias resolves to `app/[locale]/`.
- Import extensions (none, `.js`, `.jsx`) are mixed in the codebase. All work fine; new code can use any style.
- Icons: use [icon-park](https://iconpark.oceanengine.com/official). Import as:
  ```ts
  import IconName from "@icon-park/react/lib/icons/IconName";
  ```
- CSS: [TailwindCSS](https://tailwindcss.com/).
  - Custom theme variables: `app/[locale]/globals.css`
  - This project uses custom breakpoints such as `main-wide:` instead of standard `md:` or `lg:`.
  - Custom utility classes: `styles/utilities.css`
  - When the same styles are repeated, extract them into a Tailwind component in a `styles/*.css` file. Custom component names start with `fn-`.
- The `/share/[cid]` page is special. It works by having the Hono backend rewrite the exported placeholder HTML at runtime. It does **not** work in the `pnpm run ndev` development environment.
  - Use `/{ja,en}/share/placeholder` for the placeholder page during development.
- `/play` page
  - In the FallingWindow component, it triggers a React re-render every frame by updating a state called `rerenderIndex` within the requestAnimationFrame.
  - Notes are drawn on the canvas. Canvas manipulation occurs during the FallingWindow re-render. The code that actually draws each note is managed by the DisplayNikochan class.
- `/edit` page
  - The state of the chart data being edited is managed by the `ChartEditing` class (under `chart/src/editing/`), and is not a typical React state management method.
  - `useEffect` will not execute automatically even if the dependency array is correctly specified; it needs to subscribe to the events of `ChartEditing` class.

### Service Worker

Build both the frontend and the service worker, then access via the backend:

```sh
pnpm run nbuild && pnpm run swbuild
```

The service worker ([`worker/entry.ts`](worker/entry.ts), bundled into `/sw.js`) caches all static assets and pages (except `/api` and `/og`). It updates the cache whenever `/buildVer.json` changes.

### Localization (i18n)

- Language resources are in `i18n` directory.
- To add a new language, create a new directory with the language code and add all the translations in the corresponding files.

See also [next-intl Usage guide](https://next-intl.dev/docs/usage/messages)

## Versioning

* major version follows the Chart data format version.
* minor version is increased with `node ./versionBump.js minor` for each PR
    * Changes that do not so much affect app/ such as dependabot or update README.md or minor fixes are not counted.
* ChangeLogs are written in [i18n/[locale]/changelog.mdx](i18n/ja/changelog.mdx) for user-friendly explanation and in [CHANGELOG_dev.md](CHANGELOG_dev.md) for more detailed explanation. I may not update the information if the changes are minor.

## Deployment Notes (for maintainers)

<details>

### Environment Variables

| Variable | Location | Description |
|---|---|---|
| `MONGODB_URI` | backend | `mongodb://...` | 
| `API_ENV` | backend | DO NOT SET; if set to `development`, development-specific behaviors such as password bypass will be enabled |
| `API_NO_RATELIMIT` | backend | DO NOT SET |
| `SECRET_SALT` | backend | string |
| `VERCEL_PROTECTION_BYPASS_SECRET` | backend | string |
| `API_CACHE_EDGE` | backend | `1` or unset |
| `ASSET_PREFIX` | backend & frontend | `https://domain-of-your-assets` or unset |
| `BACKEND_PREFIX` | backend & frontend | `https://domain-of-your-backend` or unset — needed when the page origin differs from the backend origin |
| `BACKEND_OG_PREFIX` | backend | alternate backend for OG image generation; used by Cloudflare Worker entrypoint only |
| `BACKEND_ALT_PREFIX` | frontend | fallback backend URL used when the primary backend returns 5xx |
| `NO_PREFETCH` | frontend | `1` or unset |
| `YOUTUBE_API_KEY` | backend | API key for YouTube Data API v3 |
| `ALLOW_FETCH_ERROR` | frontend | `1` or unset |
| `VERSION_SUFFIX` | frontend | string |
| `TITLE_SUFFIX` | frontend | string |
| `TWITTER_API_KEY`, `TWITTER_API_KEY_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`, `GEMINI_API_KEY`, `DISCORD_WEBHOOK_ID`, `DISCORD_WEBHOOK_TOKEN` | cronjob | — |

### Vercel

- Set `NODEJS_HELPERS=0`. See [honojs/hono#1256](https://github.com/honojs/hono/issues/1256).
- Set `ENABLE_EXPERIMENTAL_COREPACK=1`. See [Vercel docs](https://vercel.com/docs/builds/configure-a-build#corepack).
- Run `pnpm config set node-linker hoisted --local` before installing dependencies (otherwise Vercel cannot resolve packages in workspaces).

### Cloudflare Worker

- Access to MongoDB from a Cloudflare Worker is unstable for some reason.
- Currently, API requests with a hostname that exactly matches `nikochan.utcode.net` are passed to the origin server before being processed by the Worker.

### Reverse Proxy

- Falling Nikochan uses the **rightmost** value of `x-forwarded-for` for rate limiting. Avoid adding the IP address to `x-forwarded-for` multiple times when going through two or more proxy servers.

</details>
