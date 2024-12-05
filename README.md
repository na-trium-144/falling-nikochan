# Falling Nikochan

* シンプルでかわいい音ゲーです。PC、タブレット、スマートフォンなどのブラウザーで手軽に遊べます。
* さらに、アカウント登録やログイン不要で誰でも譜面を作成でき、SNSなどで譜面IDを共有することで他の人に遊んでもらうことができます。
* 音源としてYouTube埋め込みを利用しています。
* バグなどあればissueまたはPRで受け付けています。たぶん。

遊び方などの説明、プレイ、譜面作成 は、 [Falling Nikochan トップページ](https://nikochan.natrium144.org) からどうぞ。

YouTube: [@nikochan144](http://www.youtube.com/@nikochan144)

[<img src="https://github.com/na-trium-144/falling-nikochan/blob/main/screenshot.jpg?raw=true" width=960 />](https://www.youtube.com/watch?v=reUvjq5TRus)

## development

* MongoDB のサーバーをインストールし、起動してください
    * [公式ドキュメント](https://www.mongodb.com/docs/manual/installation/)
    * Falling Nikochan はその中に `nikochan` という名前のデータベースを作成、使用します
* `.env` ファイルにデータベースのurlなどを記述、または環境変数で設定
```
MONGODB_URI="mongodb://localhost:27017"
```
* 環境変数または `.env` に `ASSET_PREFIX` を設定すると、`/_next/static`以下および`/assets/`以下のファイルを別のCDNから取得することができます
(前者はNext.jsのconfigの [assetPrefix](https://nextjs.org/docs/app/api-reference/next-config-js/assetPrefix))
* working directory はfalling-nikochanのルートにしてください
```sh
npm ci
npm run dev
```

## バージョン番号について

* [拍子変化の実装 #80](https://github.com/na-trium-144/falling-nikochan/pull/80) をver5.0として、今後はPRごとにminorバージョンを上げます
    * majorバージョンはChartデータフォーマットのバージョンに合わせます
    * dependabotや、update README.md など、 app/ に変更を加えていないものはカウントしないことにします
* バージョンは package.json に記述します
    * 各PRのマージ前に `npm version minor` コマンドで上げます
* ChangeLog は CHANGELOG.md に記述し、 /main/version からも閲覧できます
    * なのでどちらかというとユーザー向けの説明
