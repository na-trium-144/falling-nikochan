/** @type {import('next').NextConfig} */

import { execFileSync } from "node:child_process";
import createMDX from "@next/mdx";
import packageJson from "./package.json" with { type: "json" };
import { join, dirname } from "node:path";
import dotenv from "dotenv";
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

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});
export default withMDX(nextConfig);
