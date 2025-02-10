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

[<img src="https://github.com/na-trium-144/falling-nikochan/blob/main/screenshot.jpg?raw=true" width=960 />](https://www.youtube.com/watch?v=reUvjq5TRus)

## development

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
* Backend (route/)
    * Built with Hono, so it can be run with many runtimes.
    * For a local development environment, server can be run with Node.js or Bun (`http://localhost:8787`)
        ```sh
        npm run ldev
        # or
        bun bdev
        ```
    * For the deployment, currently using Vercel
* Frontend (app/)
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

## Localization

See [app/i18n](app/i18n/).

## Versioning

* major version follows the Chart data format version.
* minor version is increased by `npm version minor` command for each PR
    * Changes that do not affect app/ such as dependabot or update README.md are not counted.
* ChangeLogs are written in [app/i18n/[locale]/changelog.mdx](app/i18n/ja/changelog.mdx) for user-friendly explanation and in [CHANGELOG_dev.md](CHANGELOG_dev.md) for more detailed explanation.
