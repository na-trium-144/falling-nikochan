# Falling Nikochan

* シンプルでかわいい音ゲーです。PCでもスマホでもブラウザー上から遊ぶことができます。
* 誰でも譜面を作成してアップロードすることができ、譜面IDを共有することで他の人に遊んでもらうことができます。
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
FS_VOLUME="http://localhost:8080"
```

* (install git)
    * ビルド中にコミットIDを取得する箇所があるので必要です

* backend + frontend
    * venvを使う場合はactivateした状態で
    * working directory はfalling-nikochanのルートにしてください
```sh
npm install
npx prisma db push
npm run dev
```

## deploy

* developmentの場合と同様にpostgresqlとseaweedfsを起動して
```sh
npm run start
```

* Dockerを使うこともできます。Dockerfile をビルドするか、ビルド済みのもの(amd64, arm64)が `ghcr.io/na-trium-144/falling-nikochan/falling-nikochan:latest` としてpullできます
    * 別途postgresqlとseaweedfsを起動してください
    * .env ファイルを用意し、 /root/nikochan/.env としてマウントしてください
    * ポート3000で起動します
