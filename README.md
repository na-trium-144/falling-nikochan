# Falling Nikochan

* Simple and cute rhythm game. Playable on web browsers such as PC, tablet, and smartphone.
* Anyone can create a chart without any account registration or login. Share the chart ID on SNS to let others play.
* Uses YouTube embed as audio source.

For more information, play, and chart creation, please visit the [Falling Nikochan top page](https://nikochan.utcode.net).

> * シンプルでかわいい音ゲーです。PC、タブレット、スマートフォンなどのブラウザーで手軽に遊べます。
> * さらに、アカウント登録やログイン不要で誰でも譜面を作成でき、SNSなどで譜面IDを共有することで他の人に遊んでもらうことができます。
> * 音源としてYouTube埋め込みを利用しています。
>
> 遊び方などの説明、プレイ、譜面作成 は、 [Falling Nikochan トップページ](https://nikochan.utcode.net) からどうぞ。

YouTube: [@nikochan144](http://www.youtube.com/@nikochan144)

[<img src="https://github.com/na-trium-144/falling-nikochan/blob/main/.github/screenshot.jpg?raw=true" width=960 />](https://www.youtube.com/watch?v=reUvjq5TRus)

## Development

* Install [Node.js](https://nodejs.org/ja/download) (>=20) or [Bun](https://bun.sh/docs/installation) (>=1.2).
* Install [MongoDB](https://www.mongodb.com/docs/manual/installation/) and run on `localhost:27017`
    * If you have Docker installed, it is easy to run and recommended
        ```sh
        docker run --rm -p 27017:27017 -d mongodb/mongodb-community-server:latest
        ```
        * or `npm run mongo-docker`, `bun mongo-docker` does the same.
    * Falling Nikochan creates and uses a database named `nikochan` in it
* Create a `.env` file with the following contents
    ```sh
    MONGODB_URI="mongodb://localhost:27017"
    BACKEND_PREFIX="http://localhost:8787"
    API_ENV="development"
    API_NO_RATELIMIT="1"
    ```
    * other environment variables:
        * `SECRET_SALT`
        * `API_CACHE_EDGE`
        * `ASSET_PREFIX`
        * `BACKEND_PREFIX`
        * `NO_PREFETCH`
* Install dependencies
    ```sh
    npm ci  # or  bun i
    ```
    * [GitHub Action ensures](.github/workflows/sync-lock.yaml) the two lockfiles synchronized with package.json.
* Common files (chart/)
    * When you make any changes, you need to run tsc to re-compile them into js files so that they can be imported correctly in the frontend and backend:
        ```sh
        npm run t  # or  bun t
        ```
* Backend
    * Serves /api, /share, /og, and / (redirect).
    * Built with Hono, so it can be run with many runtimes.
    * For a local development environment, server can be run with Node.js or Bun (`http://localhost:8787`)
        ```sh
        npm run ldev  # or  bun bdev
        ```
    * For the deployment, currently using Vercel
* Frontend
    * development environment of Next.js (`http://localhost:3000/ja` or `/en`)
        * Doing SSR for the path `/share/[cid]` by the backend modifying the exported html file, so this page does not work in the development environment.
        * Instead, `/ja/share/placeholder` shows the placeholder page.
        ```sh
        npm run ndev  # or  bun ndev
        ```
    * Or, SSR with exported html files
        * All pages should work by accessing the backend (`http://localhost:8787`) after building frontend, but there is no hot-reload.
        ```sh
        npm run nbuild  # or  bun nbuild
        ```
    * As of Bun v1.2.2, `bun -b nbuild` seems to be unstable for this project.

## API

The code for the backend is in the [route/](route/) directory, NOT in the [api/](api/) directory.

<details><summary>API List</summary>

See also [chart/src/chart.ts](chart/src/chart.ts) for relations among the chart data formats.

* `GET /api/brief/:cid` - Get the brief information of the chart.
    * `:cid` - Chart ID
    * Response
        * [ChartBrief](chart/src/chart.ts) as JSON with status code 200
        * `{message?: string}` as JSON with status code
            * 400 (invalid cid),
            * 404 (cid not found),
            * or 500 (other error)
* `GET /api/latest` - Get the list of 25 latest updated charts.
    * Response
        * `{cid: string}[]` as JSON with status code 200
* `GET /api/record/:cid` - Get the summary of the record from all players for the chart.
    * `:cid` - Chart ID
    * Response
        * Array of [RecordGetSummary](chart/src/record.ts) as JSON with status code 200
        * `{message?: string}` as JSON with status code
            * 400 (invalid cid),
            * or 500 (other error)
* `POST /api/record/:cid` - Post a play record to the database. The record for every play is stored.
    * `:cid` - Chart ID
    * Request Body
        * [RecordPost](chart/src/record.ts) as JSON
            * The data should be the record of the current play of the player, regardless of the best score etc.
    * Response
        * empty response with status code 204
        * `{message?: string}` as JSON with status code
            * 400 (invalid cid),
            * or 500 (other error)
* `GET /api/seqFile/:cid/:lvIndex` - Deprecated. Returns 410.
* `GET /api/playFile/:cid/:lvIndex` - Get the level file. Used only when playing chart, not for editing.
    * `:cid` - Chart ID
    * `:lvIndex` - Level index number
    * Response
        * [Level6Play](chart/src/legacy/chart6.ts) or [Level8Play](chart/src/legacy/chart8.ts) serialized with MessagePack with status code 200
        * `{message?: string}` as JSON with status code
            * 400 (invalid cid),
            * 404 (cid or level not found),
            * or 500 (other error)
* `GET /api/hashPasswd/:cid` - Get the unique hash of the password for the chart.
    * `:cid` - Chart ID
    * Query Parameters
        * `cp=` sha256 hash of (cid + passwd)
    * if `pUserSalt` value is not in the cookie, a random string is generated and stored.
    * Response
        * sha256 hash of (cid + passwd + hashKey) as raw text with status code 200
        * `{message?: string}` as JSON with status code
            * 400 (invalid cid),
            * 401 (wrong passwd),
            * 404 (cid not found),
            * or 500 (other error)
* `GET /api/chartFile/:cid` - Get the chart file. Password is required.
    * `:cid` - Chart ID
    * Query Parameters
        * Either one of the following is required.
            * `cp=` sha256 hash of (cid + passwd)
            * `ph=` hash of passwd obtained from `/api/hashPasswd/:cid?cp=...`
                * The cookie value `pUserSalt` must be set and match with that used for the hash.
            * `pbypass=1` (only on development environment) bypass the password check
    * Response
        * [Chart4](chart/src/legacy/chart4.ts), [Chart5](chart/src/legacy/chart5.ts), [Chart6](chart/src/legacy/chart6.ts), [Chart7](chart/src/legacy/chart7.ts), [Chart8Edit](chart/src/legacy/chart8.ts) or [Chart9Edit](chart/src/legacy/chart9.ts) serialized with MessagePack with status code 200
        * `{message?: string}` as JSON with status code
            * 400 (invalid cid),
            * 401 (wrong passwd),
            * 404 (cid not found),
            * or 500 (other error)
* `POST /api/chartFile/:cid` - Post the chart file. The previous password is required. If the posted chart data has a different password, it will be used next time.
    * `:cid` - Chart ID
    * Query Parameters: same as GET
    * Request Body: [Chart8Edit](chart/src/legacy/chart8.ts) serialized with MessagePack
    * Response
        * empty response with status code 204
        * `{message?: string}` as JSON with status code
            * 400 (invalid cid),
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
            * 400 (invalid cid),
            * 401 (wrong passwd),
            * 404 (cid not found),
            * or 500 (other error)
* `GET /api/newChartFile` - returns 400.
* `POST /api/newChartFile` - Create a new chart file.
    * Request Body: [Chart8Edit](chart/src/legacy/chart8.ts) serialized with MessagePack
    * Response
        * `{cid: string}` as JSON with status code 200
        * `{message?: string}` as JSON with status code
            * 409 (chart data is Chart7 or older),
            * 413 (too large),
            * 415 (invalid data),
            * 429 (rate limited),
            * or 500 (other error)

</details>

## Localization

[i18n/](i18n/) directory contains the translations of the application.

To add a new language, create a new directory with the language code and add all the translations in the corresponding files.

See also [next-intl Usage guide](https://next-intl.dev/docs/usage/messages)

## Versioning

* major version follows the Chart data format version.
* minor version is increased by `npm version -ws minor` command for each PR
    * Changes that do not affect app/ such as dependabot or update README.md are not counted.
* ChangeLogs are written in [i18n/[locale]/changelog.mdx](i18n/ja/changelog.mdx) for user-friendly explanation and in [CHANGELOG_dev.md](CHANGELOG_dev.md) for more detailed explanation.
