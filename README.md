# Falling Nikochan

## development

* database + storage
```
docker-compose up
```

* docker-compose.ymlの設定をもとに、 `.env` ファイルにデータベースのurlなどを記述
```
DATABASE_URL="postgresql://postgres:example@localhost:5432/postgres"
FS_MASTER="http://localhost:9333"
FS_VOLUME="http://localhost:8080"
```

* install ffmpeg

* install python and dependencies
```
pip install yt-dlp soundfile msgpack numpy
```

* backend + frontend
```
npm install
npx prisma db push
npm run dev
```
