/** @type {import('next').NextConfig} */

import { execFileSync } from "node:child_process";
import packageJson from "./package.json" assert { type: "json" };

const date = new Date().toUTCString();
const commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
  encoding: "utf8",
}).trim();

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
