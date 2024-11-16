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
    * Falling Nikochan はその中に `nikochan` という名前のデータベースを作成、使用します
* `.env` ファイルにデータベースのurlなどを記述、または環境変数で設定
```
MONGODB_URI="mongodb://localhost:27017"
```
* backend + frontend
    * working directory はfalling-nikochanのルートにしてください
```sh
npm ci
npm run dev
```

## deploy

* developmentの場合と同様に`.env`ファイルまたは環境変数でMONGODB_URIを設定して
```sh
npm run start
```
