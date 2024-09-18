# Falling Nikochan

## development

* database + storage
```
docker-compose up -d
```

* docker-compose.ymlの設定をもとに、 `.env` ファイルにデータベースのurlなどを記述
```
DATABASE_URL="postgresql://postgres:example@localhost:5432/postgres"
FS_MASTER="http://localhost:9333"
FS_VOLUME="http://localhost:8080"
```

* backend + frontend
```
npm install
npx prisma db push
npm run dev
```
