/** @type {import('next').NextConfig} */

import { execFileSync } from "node:child_process";
import packageJson from "./package.json" with { type: "json" };
import "dotenv/config";

const date = new Date().toUTCString();
let commit = "";
try {
  commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
    encoding: "utf8",
  }).trim();
} catch (e) {
  console.error("Failed to get commit hash: ", e);
}

const nextConfig = {
  assetPrefix: process.env.ASSET_PREFIX || undefined,
  output: "export",
  env: {
    buildDate: date,
    buildCommit: commit,
    buildVersion: packageJson.version.split(".").slice(0, 2).join("."),
    ASSET_PREFIX: process.env.ASSET_PREFIX || "",
    BACKEND_PREFIX:
      process.env.NODE_ENV === "development" ? process.env.BACKEND_PREFIX : "",
  },
  webpack: (config, options) => {
    config.resolve = {
      ...config.resolve,
      extensionAlias: {
        ".js": [".js", ".ts", ".tsx"],
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

export default nextConfig;
