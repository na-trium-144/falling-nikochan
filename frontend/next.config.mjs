/** @type {import('next').NextConfig} */

import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import createMDX from "@next/mdx";
import packageJson from "./package.json" with { type: "json" };
import parentPackageJson from "../package.json" with { type: "json" };
// import babelRc from "./.babelrc" with { type: "json" };
const babelRc = JSON.parse(readFileSync("./.babelrc", "utf-8"));
import { join, dirname } from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

const coreJsVersion = parentPackageJson.devDependencies["core-js"]
  .slice(1)
  .split(".")
  .slice(0, 2)
  .join(".");
const babelCoreJsVersion = babelRc.presets[0][1]["preset-env"].corejs;
if (coreJsVersion !== babelCoreJsVersion) {
  // https://github.com/babel/babel/issues/15412
  throw new Error(
    `core-js version in .babelrc (${babelCoreJsVersion}) must be exactly the same as that of installed (${coreJsVersion})`,
  );
}

const date = new Date().toUTCString();
let commit = "";
try {
  commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
    encoding: "utf8",
  }).trim();
} catch (e) {
  console.error("Failed to get commit hash: ", e);
}

const env = {
  buildDate: date,
  buildCommit: commit,
  buildVersion: packageJson.version.split(".").slice(0, 2).join("."),
  browserslist: packageJson.browserslist.join(", "),
  // prefix for every asset URL
  ASSET_PREFIX: process.env.ASSET_PREFIX || "",
  // prefix for every API call URL
  BACKEND_PREFIX: process.env.BACKEND_PREFIX || "",
  // if not empty, disable all Next.js Link prefetch
  NO_PREFETCH: process.env.NO_PREFETCH || "",
};
console.log("env: ", env);
writeFileSync(
  join(process.cwd(), "public/assets/buildVer.json"),
  JSON.stringify({ date, commit, version: env.buildVersion }),
  "utf-8",
);

const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  assetPrefix: process.env.ASSET_PREFIX || undefined,
  output: "export",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  env,
  webpack: (config, options) => {
    return {
      ...config,
      // target: "browserslist",
      // ↑ somehow this breaks build: `unhandledRejection ReferenceError: self is not defined`
      //    but it seems like it's actually reading the browserslist config in ./package.json anyway
      resolve: {
        ...config.resolve,
        extensionAlias: {
          ".js": [".js", ".ts", ".tsx"],
          ".jsx": [".js", ".ts", ".tsx"],
        },
        fallback: {
          path: false,
          fs: false,
          child_process: false,
          crypto: false,
          url: false,
          module: false,
          ...config.resolve?.fallback,
        },
      },
      module: {
        ...config.module,
        rules: (config.module?.rules || []).map((r) => ({
          ...r,
          // https://github.com/vercel/next.js/issues/74743
          exclude: (r.exclude || []).concat([/core-js/]),
        })),
      },
    };
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});
export default withMDX(nextConfig);
