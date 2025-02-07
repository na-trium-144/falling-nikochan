# Falling Nikochan

* シンプルでかわいい音ゲーです。PC、タブレット、スマートフォンなどのブラウザーで手軽に遊べます。
* さらに、アカウント登録やログイン不要で誰でも譜面を作成でき、SNSなどで譜面IDを共有することで他の人に遊んでもらうことができます。
* 音源としてYouTube埋め込みを利用しています。
* バグなどあればissueまたはPRで受け付けています。たぶん。

遊び方などの説明、プレイ、譜面作成 は、 [Falling Nikochan トップページ](https://nikochan.natrium144.org) からどうぞ。

YouTube: [@nikochan144](http://www.youtube.com/@nikochan144)

[<img src="https://github.com/na-trium-144/falling-nikochan/blob/main/screenshot.jpg?raw=true" width=960 />](https://www.youtube.com/watch?v=reUvjq5TRus)

## development

* 適当なバージョンの [Bun](https://bun.sh/docs/installation) または [Node.js](https://nodejs.org/ja/download) をインストールしてください
* [MongoDB](https://www.mongodb.com/docs/manual/installation/) をインストールし、起動してください (`localhost:27017`)
    * Dockerをインストールしているなら、Dockerを使うのが手軽でおすすめ
        ```sh
        docker run --rm -p 27017:27017 -d mongodb/mongodb-community-server:latest
        ```
    * Falling Nikochan はその中に `nikochan` という名前のデータベースを作成、使用します
* `.env` ファイルに以下を記述、または環境変数で設定
    ```sh
    MONGODB_URI="mongodb://localhost:27017"
    BACKEND_PREFIX="http://localhost:8787"
    ```
* 依存パッケージのインストール
    ```sh
    bun i
    # or
    npm ci
    ```
* バックエンド (route/)
    * Honoを使用しており、さまざまなランタイムで動かすことができます
    * ローカルの開発環境としてはBun,Node.jsでサーバーを起動できます (`http://localhost:8787`)
        ```sh
        bun bdev
        # or
        npm run ldev
        ```
    * デプロイはVercelを使っています
* フロントエンド (app/)
    * Next.js の開発環境 (`http://localhost:3000`)
        * `/share/[cid]` のパスに関してはビルド済みのhtmlファイルをバックエンドが書き換えることによりSSRしているため、このページのみ機能しません。
        * 代わりに `/share/placeholder` にアクセスするとダミーのページが開きます。
        ```sh
        bun -b ndev
        # or
        npm run ndev
        ```
    * または、ビルド済みファイルを使ったSSR
        * ビルドしたあとバックエンド(`http://localhost:8787`)にアクセスすれば全ページ動作するはずですが、ホットリロードが効きません。
        ```sh
        bun -b nbuild
        # or
        npm run nbuild
        ```

## バージョン番号について

* majorバージョンはChartデータフォーマットのバージョンに合わせます
* minorバージョンをPRごとに `npm version minor` コマンドで上げます
    * dependabotや、update README.md など、 app/ に変更を加えていないものはカウントしないことにします
* ChangeLog は [CHANGELOG.md](CHANGELOG.md) に記述し /main/version からも閲覧できるユーザー向けの説明と、
[CHANGELOG_dev.md](CHANGELOG_dev.md) に記述したより詳細な説明があります
