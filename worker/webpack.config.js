import { join, dirname } from "node:path";
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import webpack from "webpack";
import LicensePlugin from "webpack-license-plugin";
// import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import { sentryWebpackPlugin } from "@sentry/webpack-plugin";
import packageJson from "./package.json" with { type: "json" };
import dotenv from "dotenv";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

// 1. ソースコードの最終コミット
const sourceHash = execSync("git log -n 1 --pretty=format:%H -- .")
  .toString()
  .trim();

// 2. SWに関連する依存ライブラリの解決状態を JSON で取得
// --filter を使うことで、workspace 全体ではなく SW の依存ツリーだけに絞れる
const depsInfo = execSync(
  'pnpm list --filter "./src/service-worker" --depth Infinity --json'
).toString();

const depsHash = crypto.createHash("sha1").update(depsInfo).digest("hex");
const sentryRelease = `sw${packageJson.version}-${sourceHash}-${depsHash}`;

const config = {
  entry: "./entry.js",
  target: "browserslist",
  mode: process.env.API_ENV === "development" ? "development" : "production",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /core-js/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        resourceQuery: /raw/,
        type: "asset/source",
      },
    ],
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      resource.request = resource.request.replace(/^node:/, "");
    }),
    new webpack.DefinePlugin({
      "process.env.API_ENV": JSON.stringify(process.env.API_ENV),
      "process.env.ASSET_PREFIX": JSON.stringify(process.env.ASSET_PREFIX),
      "process.env.BACKEND_ALT_PREFIX": JSON.stringify(
        process.env.BACKEND_ALT_PREFIX
      ),
      "process.env.SENTRY_DSN": JSON.stringify(process.env.SENTRY_DSN),
      "process.env.SENTRY_TUNNEL": JSON.stringify(process.env.SENTRY_TUNNEL),
      "process.env.SENTRY_RELEASE": JSON.stringify(sentryRelease),
      process: "{cwd:()=>''}",
    }),
    new LicensePlugin({
      outputFilename: "oss-licenses/worker.json",
      includeNoticeText: true,
      excludedPackageTest: (packageName /*, version*/) => {
        return packageName.startsWith("@falling-nikochan");
      },
    }),
    sentryWebpackPlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      url: process.env.SENTRY_URL || undefined,
      release: { name: sentryRelease },
      sourcemaps: {
        // As you're enabling client source maps, you probably want to delete them after they're uploaded to Sentry.
        // Set the appropriate glob pattern for your output folder - some glob examples below:
        filesToDeleteAfterUpload: ["./**/*.map"],
      },
    }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@vercel/og": false,
      dotenv: false,
      mongodb: false,
      "node:path": false,
      react: false,
      "@msgpack/msgpack": false,
      wasmoon: false,
      "@falling-nikochan/chart": false,
      "@falling-nikochan/i18n/dynamic.js":
        "@falling-nikochan/i18n/staticMin.js",
      "./api/app.js": false,
      "./api/brief.js": false,
      "./og/app.js": false,
      "./cron/app.js": false,
      "./cron/latest.js": false,
      "./cron/popular.js": false,
      "./cron/discord.js": false,
      "./sitemap.js": false,
      "./rss.js": false,
    },
    fallback: {
      path: false,
      crypto: false,
      zlib: false,
      util: false,
    },
  },
  output: {
    path: join(dirname(process.cwd()), "frontend/out"),
    filename: "sw.js",
  },
};
export default config;
