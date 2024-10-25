# Falling Nikochan

* シンプルでかわいい音ゲーです。PC、タブレット、スマートフォンなどのブラウザーで手軽に遊べます。
* さらに、アカウント登録やログイン不要で誰でも譜面を作成でき、SNSなどで譜面IDを共有することで他の人に遊んでもらうことができます。
* 音源としてYouTube埋め込みを利用しています。

## development

* database + storage
    * docker-compose.yml にpostgresqlと[seaweedfs](https://github.com/seaweedfs/seaweedfs)を記述してあるので、それを起動すると簡単です
```sh
docker compose up
```

* `.env` ファイルにデータベースのurlなどを記述
    * docker-compose.yml をそのまま使っている場合は以下
```
DATABASE_URL="postgresql://postgres:example@localhost:5432/postgres"
FS_MASTER="http://localhost:9333"
```

* (install git)
    * ビルド中にコミットIDを取得する箇所があるので必要です

* backend + frontend
    * working directory はfalling-nikochanのルートにしてください
```sh
npm install
npm run dev
```

## deploy

* developmentの場合と同様にpostgresqlとseaweedfsを起動して
```sh
npm run start
```

* データベースの public.LevelBrief テーブルはstart時に削除されます (initDB.js)
    * ただのキャッシュなので必要なときに再生成されます
    * そのため LevelBrief のschemaの変更は問題ありませんが、
    それ以外のテーブルのschemaに破壊的変更が入っている場合は、 `prisma db push` でエラーになります。
    手動でなんとかしてください。
* seaweedfsのボリュームを複数起動してバックアップしたい場合は、
masterのコマンドを `master -defaultReplication=010`,
volumeのコマンドを `volume ... -rack=rack1 -publicUrl=http://localhost:8080`,
`volume ... -rack=rack2 -publicUrl=http://localhost:8081`
などとすればできそう?
* Dockerを使うこともできます。Dockerfile をビルドするか、ビルド済みのもの(amd64, arm64)が `ghcr.io/na-trium-144/falling-nikochan/falling-nikochan:latest` としてpullできます
    * 別途postgresqlとseaweedfsを起動してください
    * .env ファイルを用意し、 /root/nikochan/.env としてマウントしてください
    * ポート3000で起動します
