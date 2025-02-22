# Falling Nikochan

* Simple and cute rhythm game. Playable on web browsers such as PC, tablet, and smartphone.
* Anyone can create a chart without any account registration or login. Share the chart ID on SNS to let others play.
* Uses YouTube embed as audio source.

For more information, play, and chart creation, please visit the [Falling Nikochan top page](https://nikochan.natrium144.org).

> * シンプルでかわいい音ゲーです。PC、タブレット、スマートフォンなどのブラウザーで手軽に遊べます。
> * さらに、アカウント登録やログイン不要で誰でも譜面を作成でき、SNSなどで譜面IDを共有することで他の人に遊んでもらうことができます。
> * 音源としてYouTube埋め込みを利用しています。
>
> 遊び方などの説明、プレイ、譜面作成 は、 [Falling Nikochan トップページ](https://nikochan.natrium144.org) からどうぞ。

YouTube: [@nikochan144](http://www.youtube.com/@nikochan144)

[<img src="https://github.com/na-trium-144/falling-nikochan/blob/main/.github/screenshot.jpg?raw=true" width=960 />](https://www.youtube.com/watch?v=reUvjq5TRus)

## Development

* Install [Node.js](https://nodejs.org/ja/download) or [Bun](https://bun.sh/docs/installation).
* Install [MongoDB](https://www.mongodb.com/docs/manual/installation/) and run on `localhost:27017`
    * If you have Docker installed, it is easy to use and recommended
        ```sh
        docker run --rm -p 27017:27017 -d mongodb/mongodb-community-server:latest
        ```
    * Falling Nikochan creates and uses a database named `nikochan` in it
* Create a `.env` file with the following contents
    ```sh
    MONGODB_URI="mongodb://localhost:27017"
    BACKEND_PREFIX="http://localhost:8787"
    API_ENV="development"
    ```
* Install dependencies
    * [GitHub Action ensures](.github/workflows/sync-lock.yaml) the two lockfiles synchronized with package.json.
        ```sh
        npm ci
        # or
        bun i
        ```
* Backend
    * Built with Hono, so it can be run with many runtimes.
    * For a local development environment, server can be run with Node.js or Bun (`http://localhost:8787`)
        ```sh
        npm run ldev
        # or
        bun bdev
        ```
    * For the deployment, currently using Vercel
* Frontend
    * development environment of Next.js (`http://localhost:3000/ja` or `/en`)
        * Doing SSR for the path `/share/[cid]` by the backend modifying the exported html file, so this page does not work in the development environment.
        * Instead, `/share/placeholder` shows the placeholder page.
        ```sh
        npm run ndev
        # or
        bun ndev
        ```
    * Or, SSR with exported html files
        * All pages should work by accessing the backend (`http://localhost:8787`) after building frontend, but there is no hot-reload.
        ```sh
        npm run nbuild
        # or
        bun nbuild
        ```
    * As of Bun v1.2.2, `bun -b nbuild` seems to be unstable for this project.

## API

The code for the backend is in the [route/](route/) directory, NOT in the [api/](api/) directory.

<details><summary>API List</summary>

See also [chartFormat/chart.ts](chartFormat/chart.ts) for relations among the chart data formats.

* `GET /api/brief/:cid` - Get the brief information of the chart.
    * `:cid` - Chart ID
    * Response
        * [ChartBrief](chartFormat/chart.ts) as JSON with status code 200
        * `{message?: string}` as JSON with status code
            * 404 (cid not found),
            * or 500 (other error)
* `GET /api/latest` - Get the list of 25 latest updated charts.
    * Response
        * `{cid: string}[]` as JSON with status code 200
* `GET /api/seqFile/:cid/:lvIndex` - Deprecated. Returns 410.
* `GET /api/playFile/:cid/:lvIndex` - Get the level file. Used only when playing chart, not for editing.
    * `:cid` - Chart ID
    * `:lvIndex` - Level index number
    * Response
        * [Level6Play](chartFormat/legacy/chart6.ts) or [Level8Play](chartFormat/legacy/chart8.ts) serialized with MessagePack with status code 200
        * `{message?: string}` as JSON with status code
            * 404 (cid or level not found),
            * or 500 (other error)
* `GET /api/hashPasswd/:cid` - Get the hash of the password for the chart.
    * `:cid` - Chart ID
    * Query Parameters
        * `pw=` the raw editing password
    * if `hashKey` value is not in the cookie, a random string is generated and stored.
    * Response
        * sha256 hash of (cid + passwd + hashKey) as raw text with status code 200
* `GET /api/chartFile/:cid` - Get the chart file. Password is required.
    * `:cid` - Chart ID
    * Query Parameters
        * Either one of the following is required.
            * (deprecated) `p=` sha256 hash of the editing password
            * `pw=` the raw editing password
            * `ph=` sha256 hash of (cid + passwd + hashKey). Used for a saved password in frontend app, instead of saving the raw password.
                * The cookie value `hashKey` must be set and match with that used for the hash.
            * `pbypass=1` (only on development environment) bypass the password check
    * Response
        * [Chart4](chartFormat/legacy/chart4.ts), [Chart5](chartFormat/legacy/chart5.ts), [Chart6](chartFormat/legacy/chart6.ts), [Chart7](chartFormat/legacy/chart7.ts) or [Chart8Edit](chartFormat/legacy/chart8.ts) serialized with MessagePack with status code 200
        * `{message?: string}` as JSON with status code
            * 401 (wrong passwd),
            * 404 (cid not found),
            * or 500 (other error)
* `POST /api/chartFile/:cid` - Post the chart file. The previous password is required. If the posted chart data has a different password, it will be used next time.
    * `:cid` - Chart ID
    * Query Parameters: same as GET
    * Request Body: [Chart8Edit](chartFormat/legacy/chart8.ts) serialized with MessagePack
    * Response
        * empty response with status code 204
        * `{message?: string}` as JSON with status code
            * 401 (wrong passwd),
            * 404 (cid not found),
            * 409 (chart data is Chart7 or older),
            * 413 (too large),
            * 415 (invalid data),
            * or 500 (other error)
* `DELETE /api/chartFile/:cid` - Delete the chart file. Password is required. Currently unused by the frontend app.
    * `:cid` - Chart ID
    * Query Parameters: same as GET
    * Response
        * empty response with status code 204
        * `{message?: string}` as JSON with status code
            * 401 (wrong passwd),
            * 404 (cid not found),
            * or 500 (other error)
* `GET /api/newChartFile` - returns 400.
* `POST /api/newChartFile` - Create a new chart file.
    * Request Body: [Chart8Edit](chartFormat/legacy/chart8.ts) serialized with MessagePack
    * Response
        * `{cid: string}` as JSON with status code 200
        * `{message?: string}` as JSON with status code
            * 409 (chart data is Chart6 or older),
            * 413 (too large),
            * 415 (invalid data),
            * 429 (rate limited),
            * or 500 (other error)

</details>

## Localization

[i18n/](i18n/) directory contains the translations of the application.

To add a new language, create a new directory with the language code and add all the translations in the corresponding files.

When a new language added, it is automatically applied to the application except for the following files:
- app/[locale]/edit/guideMain.tsx
- app/[locale]/main/policies/page.tsx
- app/[locale]/main/version/page.tsx
- route/app.ts (`supportedLanguages:` in languageDetector)

See also [next-intl Usage guide](https://next-intl.dev/docs/usage/messages)

## Versioning

* major version follows the Chart data format version.
* minor version is increased by `npm version minor` command for each PR
    * Changes that do not affect app/ such as dependabot or update README.md are not counted.
* ChangeLogs are written in [app/i18n/[locale]/changelog.mdx](app/i18n/ja/changelog.mdx) for user-friendly explanation and in [CHANGELOG_dev.md](CHANGELOG_dev.md) for more detailed explanation.
