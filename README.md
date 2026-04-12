# Falling Nikochan

[![Production Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fnikochan.utcode.net%2FbuildVer.json&query=%24.version&prefix=v&label=Prod&color=%23b8f6fe)](https://nikochan.utcode.net)
[![Staging Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fnikochan-staging.utcode.net%2FbuildVer.json&query=%24.version&prefix=v&label=Staging&color=%23441306)](https://nikochan-staging.utcode.net)
[![GitHub License](https://img.shields.io/github/license/na-trium-144/falling-nikochan)](./LICENSE)

[![YouTube Channel Subscribers](https://img.shields.io/youtube/channel/subscribers/UChAEFwUtjsbWmWwZSxYLXWQ?label=%40nikochan144)](https://www.youtube.com/@nikochan144)
[![Twitter Follow](https://img.shields.io/twitter/follow/nikochan144)](https://x.com/nikochan144)

* Simple and cute rhythm game. Playable on web browsers such as PC, tablet, and smartphone.
* Anyone can create a chart without any account registration or login. Share the chart ID on SNS to let others play.
* Uses YouTube embed as audio source.

For more information, play, and chart creation, please visit the Falling Nikochan top page: https://nikochan.utcode.net .

> * シンプルでかわいい音ゲーです。PC、タブレット、スマートフォンなどのブラウザーで手軽に遊べます。
> * さらに、アカウント登録やログイン不要で誰でも譜面を作成でき、SNSなどで譜面IDを共有することで他の人に遊んでもらうことができます。
> * 音源としてYouTube埋め込みを利用しています。
>
> 遊び方などの説明、プレイ、譜面作成 は、Falling Nikochan トップページからどうぞ: https://nikochan.utcode.net

<img src="https://github.com/na-trium-144/falling-nikochan/blob/main/.github/screenshot_15.jpg?raw=true" width=960 />

## Development

* Install [Node.js](https://nodejs.org/ja/download).
    * Node.js >=23.6 is required for `npm run test`, but development and build can run on >=20.x.
* Install [pnpm](https://pnpm.io/installation) >=10.
* Install [MongoDB](https://www.mongodb.com/docs/manual/installation/) and run on `localhost:27017`.
    * This is required for running the backend and tests. It is not necessary if you are only testing the frontend.
    * Falling Nikochan creates and uses a database named `nikochan` in it
    * If Docker is installed, you can easily run it with the following command (recommended):
        ```sh
        docker run --rm -p 27017:27017 -d mongodb/mongodb-community-server:latest
        ```
        * or `pnpm run mongo-docker` does the same.
* Create a `.env` file with the following contents
    ```sh
    MONGODB_URI="mongodb://localhost:27017"
    BACKEND_PREFIX="http://localhost:8787"
    API_ENV="development"
    API_NO_RATELIMIT="1"
    ```
    * other environment variables:
        * `SECRET_SALT` (backend): string
        * `VERCEL_PROTECTION_BYPASS_SECRET` (backend): string
        * `API_CACHE_EDGE` (backend): `1` or unset
        * `ASSET_PREFIX` (backend & frontend): `https://domain-of-your-assets` or unset
        * `BACKEND_PREFIX` (backend & frontend): `https://domain-of-your-backend` or unset
            * needed when origin of page is different from backend origin. (separate development server, or behind reverse proxy etc.)
        * `BACKEND_OG_PREFIX` (backend): alternate backend for og image generation, `https://domain-of-your-backend` or unset
            * used by cloudflare worker entrypoint only
        * `BACKEND_ALT_PREFIX` (frontend): `https://domain-of-your-backend` or unset
            * used when backend returns 5xx
        * `NO_PREFETCH` (frontend): `1` or unset
        * `YOUTUBE_API_KEY` (backend): API key for YouTube Data API v3 (optional)
        * `ALLOW_FETCH_ERROR` (frontend): `1` or unset
        * `VERSION_SUFFIX` (frontend): string
        * `TITLE_SUFFIX` (frontend): string
        * `TWITTER_API_KEY`, `TWITTER_API_KEY_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`,`GEMINI_API_KEY`, `DISCORD_WEBHOOK_ID`, `DISCORD_WEBHOOK_TOKEN` (for cronjob)
* Install dependencies
    ```sh
    pnpm install
    ```
* Seeding the database with initial data
    ```sh
    pnpm run seed
    ```
    * This inserts a sample chart at cid:102399 ("Get Started!").
* Common files (chart/)
    * Frontend code does not import ts files directly, but the compiled js files instead.
    * To manually compile the ts files in chart/ to js files:
        ```sh
        pnpm run t
        ```
    * To watch changes and automatically compile them into js files during development:
        ```sh
        pnpm run cdev
        ```
    * When building frontend or before running tests, it automatically runs tsc.
* Backend
    * Serves /api, /share, /og, and / (redirect).
    * Built with Hono, so it can be run with many runtimes.
    * For a local development environment, run the server with Node.js (./route/serve-local.ts) at http://localhost:8787.
        ```sh
        pnpm run ldev
        ```
    * For the deployment, currently using Cloudflare Worker (./route/serve-cf.js), Vercel (./api/index.js) and Bun (./route/serve-bun-prod.ts)
    * You may also need to update vercel.json if you add API paths.
* Frontend
    * development environment of Next.js (`http://localhost:3000/ja` or `/en`)
        * `http://localhost:3000/` results in 404 not found. Please access `/ja` or `/en`.
        * The path `/share/[cid]` is special; this page is designed to display content by modifying the exported HTML file with Hono backend. this page will not work in the development environment. Instead, `/{ja,en}/share/placeholder` shows the placeholder page.
        ```sh
        pnpm run ndev
        ```
    * Or, test with the exported HTML file
        * All pages should work by accessing the backend (`http://localhost:8787`) after building frontend, but there is no hot-reload.
        ```sh
        pnpm run nbuild
        ```
    * This project uses icon-park library for icons. Import with `import IconName from "@icon-park/react/lib/icons/IconName";`.
    * This project uses TailwindCSS.
        * Custom theme variables are defined in app/[locale]/globals.css.
        * Custom utility classes are defined in styles/utilities.css.
        * Instead of writing the same style multiple times, extract it into a tailwind component and put it in a CSS file under styles/ (the name of custom component starts with `fn-`).
* Service Worker
    * Build frontend and service worker
    ```sh
    pnpm run nbuild && pnpm run swbuild
    ```
    * Access the backend (`http://localhost:8787`) to see the service worker in action
    * The service worker ([worker/entry.ts](worker/entry.ts) bundled into /sw.js) fetches and stores all the assets and the pages, except for /api and /og.
        * Whenever /buildVer.json (generated by frontend/next.config.mjs) changes, it downloads the static file list and archive file (generated by frontend/listStaticFiles.js) and update the cache.
        * it uses custom languageDetector middleware based on `navigator.languages` to determine the language of the page, since the Accept-Language header does not work.
* Format, Lint, and Test
    * Format all code with `pnpm run format`.
    * Verify that there are no errors with `pnpm run lint`. (Warnings are acceptable)
    * Verify that the tests pass with `pnpm run test`. (If you have changed the common files in `char/` and the backend)

### Note for deployments
* Vercel
    * Set `NODEJS_HELPERS=0`. https://github.com/honojs/hono/issues/1256
    * Set `ENABLE_EXPERIMENTAL_COREPACK=1`. https://vercel.com/docs/builds/configure-a-build#corepack
    * Run `pnpm config set node-linker hoisted --local` before installing dependencies. (Otherwise Vercel cannot find packages in workspaces)
* Cloudflare Worker
    * Access to MongoDB from Cloudflare worker is unstable for some reason.
    * Currently, API requests with a hostname that exactly matches `nikochan.utcode.net` are passed to the origin server before being processed by Cloudflare worker.
* Reverse proxy
    * Falling Nikochan uses the rightmost value of `x-forwarded-for` for the rate limit. Be careful not to add an IP address to `x-forwarded-for` multiple times in the process of going through two or more proxy servers.

## API

The code for the backend is in the [route/](route/) directory, NOT in the [api/](api/) directory.

API Reference is here: https://nikochan.utcode.net/api

See also [chart/src/chart.ts](chart/src/chart.ts) for relations among the chart data formats.

## Localization

[i18n/](i18n/) directory contains the translations of the application.

To add a new language, create a new directory with the language code and add all the translations in the corresponding files.

See also [next-intl Usage guide](https://next-intl.dev/docs/usage/messages)

## Versioning

* major version follows the Chart data format version.
* minor version is increased with `node ./versionBump.js minor` for each PR
    * Changes that do not so much affect app/ such as dependabot or update README.md or minor fixes are not counted.
* ChangeLogs are written in [i18n/[locale]/changelog.mdx](i18n/ja/changelog.mdx) for user-friendly explanation and in [CHANGELOG_dev.md](CHANGELOG_dev.md) for more detailed explanation. I may not update the information if the changes are minor.
<details><summary>When bumping major version</summary>

* Create new file in chart/src/legacy/
    * Parts of the schema that remain unchanged do not need to be duplicated; they can be imported from the previous version.
* Update chart/src/index.ts so it can import the new file in legacy/.
* Update type aliases, currentChartVer, convertToPlay, convertToLatest etc. in chart/src/chart.ts
* In route/src/api/chart.ts,
    * Update the ChartEntry and ChartEntryCompressed type to support the new version.
    * Update chartToEntry function to support the last 2 versions.
    * Update entryToChart function to support the new version.
* Update route/src/api/chartFile.ts, newChartFile.ts, playFile.ts and seqPreview.ts to support the last 2 versions, including the OpenAPI documentation (describeRoute).
* Fix any typecheck and lint errors.
    * Statements like `currentChartVer satisfies 15;` indicates that not only that statement but also the surrounding code needs to be updated when the version changes.
* Release new version of fn-commands library

</details>

## License

This project is licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later), with the exception of the assets located in the `frontend/public/assets/` directory.
The full text of the AGPL-3.0 license can be found in the [LICENSE](LICENSE) file.

The use of Falling Nikochan's API and embedding it in an iframe are exempt from AGPL-3.0-or-later and can be done freely.
The OpenAPI Specification of the API ([/api/openapi.json](https://nikochan.utcode.net/api/openapi.json)) is licensed under the MIT License.

The assets in `frontend/public/assets/` (including images, sounds, etc.) are licensed under the Creative Commons Attribution 4.0 International (CC-BY-4.0) license.
The full text of the CC-BY-4.0 license for assets can be found in the [frontend/public/assets/LICENSE](frontend/public/assets/LICENSE) file.

Copyright (c) 2024-2026 [@na-trium-144](https://github.com/na-trium-144) (and contributors)

Note: [ver13.22](https://github.com/na-trium-144/falling-nikochan/tree/v13) is the last version licensed under MIT License.
