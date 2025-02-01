# Falling Nikochan

* シンプルでかわいい音ゲーです。PC、タブレット、スマートフォンなどのブラウザーで手軽に遊べます。
* さらに、アカウント登録やログイン不要で誰でも譜面を作成でき、SNSなどで譜面IDを共有することで他の人に遊んでもらうことができます。
* 音源としてYouTube埋め込みを利用しています。
* バグなどあればissueまたはPRで受け付けています。たぶん。

遊び方などの説明、プレイ、譜面作成 は、 [Falling Nikochan トップページ](https://nikochan.natrium144.org) からどうぞ。

YouTube: [@nikochan144](http://www.youtube.com/@nikochan144)

[<img src="https://github.com/na-trium-144/falling-nikochan/blob/main/screenshot.jpg?raw=true" width=960 />](https://www.youtube.com/watch?v=reUvjq5TRus)

## development

* MongoDB のサーバーをインストールし、起動してください (`localhost:27017`)
    * [公式ドキュメント](https://www.mongodb.com/docs/manual/installation/)
    * Falling Nikochan はその中に `nikochan` という名前のデータベースを作成、使用します
* `.env` ファイルに以下を記述、または環境変数で設定
    ```sh
    MONGODB_URI="mongodb://localhost:27017"
    BACKEND_PREFIX="http://localhost:8787"
    ```
* 依存パッケージのインストール
    ```sh
    npm ci
    ```
* バックエンドサーバー (`http://localhost:8787`)
    ```sh
    npm run ldev
    ```
* フロントエンド
    * Next.js の開発環境 (`http://localhost:3000`)
    ```sh
    npm run ndev
    ```

## バージョン番号について

* [拍子変化の実装 #80](https://github.com/na-trium-144/falling-nikochan/pull/80) をver5.0として、今後はPRごとにminorバージョンを上げます
    * majorバージョンはChartデータフォーマットのバージョンに合わせます
    * dependabotや、update README.md など、 app/ に変更を加えていないものはカウントしないことにします
* バージョンは package.json に記述します
    * 各PRのマージ前に `npm version minor` コマンドで上げます
* ChangeLog は CHANGELOG.md に記述し、 /main/version からも閲覧できます
    * なのでどちらかというとユーザー向けの説明
