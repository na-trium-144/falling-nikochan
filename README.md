# Falling Nikochan

* シンプルでかわいい音ゲーです。PC、タブレット、スマートフォンなどのブラウザーで手軽に遊べます。
* さらに、アカウント登録やログイン不要で誰でも譜面を作成でき、SNSなどで譜面IDを共有することで他の人に遊んでもらうことができます。
* 音源としてYouTube埋め込みを利用しています。

## バージョン番号について

* [拍子変化の実装 #80](https://github.com/na-trium-144/falling-nikochan/pull/80) をver5.0として、今後はPRごとにminorバージョンを上げます
    * majorバージョンはChartデータフォーマットのバージョンに合わせます
    * dependabotや、update README.md など、 app/ に変更を加えていないものはカウントしないことにします
* バージョンは package.json に記述します
    * 各PRのマージ前に `npm version minor` コマンドで上げます
* ChangeLog は CHANGELOG.md に記述し、 /main/version からも閲覧できます
    * なのでどちらかというとユーザー向けの説明

## development

* MongoDB のサーバーをインストールし、起動してください
    * [公式ドキュメント](https://www.mongodb.com/docs/manual/installation/)
* `.env` ファイルにデータベースのurlなどを記述、または環境変数で設定
```
MONGODB_URI="mongodb://localhost:27017"
```
* backend + frontend
    * working directory はfalling-nikochanのルートにしてください
    * React 19 が正式リリースされるまでの間、 `npm install` または `npm ci` 時に `-f` を指定しないとエラーになります
```sh
npm ci -f
npm run dev
```

## deploy

* developmentの場合と同様に`.env`ファイルまたは環境変数でMONGODB_URIを設定して
```sh
npm run start
```
* Dockerを使うこともできます。Dockerfile をビルドするか、ビルド済みのもの(amd64, arm64)が `ghcr.io/na-trium-144/falling-nikochan/falling-nikochan:latest` としてpullできます
    * 別途postgresqlとseaweedfsを起動してください
    * .env ファイルは /root/nikochan/.env としてマウントしてください
    * ポート3000で起動します
