/** @type {import('next').NextConfig} */

import { execFileSync } from "node:child_process";

const date = new Date().toUTCString();
const commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
  encoding: "utf8",
}).trim();

const nextConfig = {
  env: {
    buildDate: date,
    buildCommit: commit,
  },
};

export default nextConfig;
