import { join, dirname } from "node:path";
import webpack from "webpack";
import dotenv from "dotenv";
// import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

const config = {
  entry: "./entry.ts",
  mode: process.env.API_ENV === "development" ? "development" : "production",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
    new webpack.IgnorePlugin({ resourceRegExp: /\.mdx$/ }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/api\//,
      contextRegExp: /route/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/og\//,
      contextRegExp: /route/,
    }),
    ...["main", "edit", "about", "play", "share"].map(
      (n) =>
        new webpack.IgnorePlugin({
          resourceRegExp: new RegExp(`${n}\\.js$`),
          contextRegExp: /i18n/,
        }),
    ),
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      resource.request = resource.request.replace(/^node:/, "");
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
    },
    fallback: {
      path: false,
      crypto: false,
      zlib: false,
      util: false,
    },
  },
  output: {
    path: join(dirname(process.cwd()), "frontend/public/assets"),
    filename: "sw.js",
  },
};
export default config;
