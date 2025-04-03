/** @type {import('next').NextConfig} */

import { execFileSync } from "node:child_process";
import createMDX from "@next/mdx";
import packageJson from "./package.json" with { type: "json" };
import { join, dirname } from "node:path";
import dotenv from "dotenv";
import { writeFileSync } from "node:fs";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

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
  USE_SW: process.env.USE_SW || "",
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
  devIndicators: false,
  assetPrefix: process.env.ASSET_PREFIX || undefined,
  output: "export",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  env,
  webpack: (config, options) => {
    config.resolve = {
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
    };
    return config;
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});
export default withMDX(nextConfig);
