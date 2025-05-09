import { join, dirname } from "node:path";
import webpack from "webpack";
import dotenv from "dotenv";
// import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

const config = {
  entry: "./dist/entry.js",
  target: "browserslist",
  mode: process.env.API_ENV === "development" ? "development" : "production",
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader'
        }
      },
    ]
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      resource.request = resource.request.replace(/^node:/, "");
    }),
    new webpack.DefinePlugin({
      "process.env.API_ENV": JSON.stringify(process.env.API_ENV),
      "process.env.ASSET_PREFIX": JSON.stringify(process.env.ASSET_PREFIX),
      process: "{cwd:()=>''}",
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
      "@ygoe/msgpack": false,
      wasmoon: false,
      "@falling-nikochan/chart": false,
      "@falling-nikochan/i18n/dynamic.js": "@falling-nikochan/i18n/staticMin.js",
      "./api/app.js": false,
      "./og/app.js": false,
      "./sitemap.js": false,
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
