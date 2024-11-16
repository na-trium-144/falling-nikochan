/** @type {import('next').NextConfig} */

import { execFileSync } from "node:child_process";
import packageJson from "./package.json" with { type: "json" };

const date = new Date().toUTCString();
let commit = "";
try {
  commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
    encoding: "utf8",
  }).trim();
} catch (e) {
  console.error("Failed to get commit hash");
}

const nextConfig = {
  env: {
    buildDate: date,
    buildCommit: commit,
    buildVersion: packageJson.version.split(".").slice(0, 2).join("."),
  },
  webpack: (config, options) => {
    config.resolve = {
      ...config.resolve,
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
