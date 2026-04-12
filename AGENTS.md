# Agent Context for Falling Nikochan

このファイルは、AIエージェントが本プロジェクトのコードベースを理解し、開発を補助するためのコンテキストを提供します。

## Project Overview
- **名称**: Falling Nikochan
- **概要**: YouTubeを音源とする、Webブラウザベースのシンプルでかわいいリズムゲーム。
- **特徴**: アカウント不要の譜面作成機能、SNS共有機能、マルチデバイス対応。

## Tech Stack
- **Frontend**: Next.js (App Router, Static Export, next-intl)
- **Backend**: Hono (Node.js, Bun, Cloudflare Workers, Vercel等で動作)
- **Database**: MongoDB (Local開発時は `localhost:27017` を使用)
- **Common Logic**: `chart/` ディレクトリに譜面データ形式と変換ロジックが集約されている。
- **Package Manager**: pnpm (v10以上)
- **Formatter**: Prettier
- **Linter**: ESLint

## Important Directory Structure & Conventions

AIエージェントは以下の特殊な構成に注意してください。

### 1. Common Logic (`chart/`)
- FrontendとBackendで共有される譜面ロジックです。
- **開発時の注意**: Frontendは `chart/` 内の `.ts` ファイルを直接インポートせず、コンパイル後の `.js` ファイルを参照します。
- ロジックを変更した場合は、必ず `pnpm run t` を実行して変更を反映させてください。
- 開発環境を立ち上げる場合は、 `pnpm run cdev` を実行しておくと変更を監視して自動で再コンパイルされます。
- Valibot のスキーマの定義がありますが、一般的な書き方と異なり関数形になっています (`export const FooSchema = () => v.object(...)` など)。これは、遅延評価することで循環参照によるエラーを回避するためです。新しくスキーマを追加する場合はこのパターンに従ってください。

### 2. Backend Code
- **注意**: Backendの本体コードは `/api/` ではなく **`/route/`** ディレクトリにあります。
- `/api/` ディレクトリはVercelデプロイ用のエントリーポイントに過ぎません。
- 入力のバリデーションやOpenAPIドキュメントの入出力型定義には Valibot を使用しています。
- バックエンドのエントリーポイントは、Node.js用の route/serve-local.ts 、Bun用の route/serve-bun-prod.ts 、Cloudflare Worker用の route/serve-cf.js 、Vercel用の api/index.js 、Service Workerで実行される worker/entry.ts (リダイレクトなど一部のロジックのみ) の5箇所あります。変更する際はこれらすべてを更新してください。
- バックエンドが処理するパスを追加した場合には vercel.json のrewritesの更新も必要な場合があります。

### 3. Frontend Code
- すべてのフロントエンドのソースコードは frontend/app/[locale]/ ディレクトリ内にあります。 ja, en ディレクトリではなく文字通り [locale] という名前のディレクトリです(dynamic route)。
- 相対パスのimportとして拡張子がないものと `.js` `.jsx` が混在していますが、現在はどれでも同様に動作します。既存のものを修正する必要はなく、新規に追加するコードはいずれの形でも構いません。
- `@/...` のパスは `app/[locale]/` ディレクトリを基準としたパスに解決します。
- アイコンは icon-park ライブラリを使用しています。 `import アイコン名 from "@icon-park/react/lib/icons/アイコン名";` でインポートしてください。
- CSSはTailwindCSSを使用しています。app/[locale]/globals.cssで独自のテーマ変数を定義しており、特にbreakpointは一般的なmdやlgを使わず独自のmain-wide:などを使用します。またstyles/utilities.cssに独自のユーティリティクラスが定義されています。同じスタイルの記述を複数書く場合はtailwind componentに抽出し、styles/以下のcssファイルに書きます(その場合独自のコンポーネントの名前はfn-で始めます)。
- shareページ(`/share/[cid]`)はNext.jsの標準的な開発環境（`pnpm run ndev`）では正しく動作しません。実際には [locale]/share/placeholder にあるダミーのページをエクスポートしたHTMLを本番環境のHonoバックエンドが書き換えることで動作しています。

### 4. Localization (i18n)
- 言語リソースは `i18n/[locale]/` に配置されています。
- UIテキストの追加・変更時は、`next-intl` のルールに従い、多言語対応を維持してください。

## Development Workflow Commands
- **全依存インストール**: `pnpm install`
- **DB初期化**: `pnpm run seed` (サンプル譜面の投入)
- **Frontend開発**: `pnpm run ndev` (または frontend ディレクトリで
`pnpm run dev`) (アクセス先: `http://localhost:3000/{ja|en}`)
- **Frontendビルド**: `pnpm run nbuild` (または frontend ディレクトリで `pnpm run build`)
- **Service Worker のビルド**: `pnpm run swbuild` (または worker ディレクトリで `pnpm run build`)
- **Backend開発**: `pnpm run ldev` (または route ディレクトリで `pnpm run dev`) (アクセス先: `http://localhost:8787`)
- **譜面ロジックのコードの再ビルド**: `pnpm run t` (または `pnpm run cdev` で更新監視)
- **型チェックとリンターの実行**: `pnpm run lint` (または個別のworkspaceで `pnpm run lint` を実行)
- **フォーマッターの実行**: `pnpm run format`
- **テスト実行**: `pnpm run test` (MongoDBが起動している必要があります)

### 変更を加えたあと(PR作成前)のチェック

- フォーマッターを実行してコードスタイルを統一してください。
- 型チェックとリンターを実行してエラーがないことを確認してください。 (warningは修正必須ではありません)
- (MongoDBが実行可能な環境の場合) テストを実行してすべてのテストがパスすることを確認してください。
