/** @type {import('next').NextConfig} */

import { execFileSync } from "node:child_process";
import {
  writeFileSync,
  readFileSync,
  copyFileSync,
  existsSync,
  unlinkSync,
} from "node:fs";
import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import packageJson from "./package.json" with { type: "json" };
import parentPackageJson from "../package.json" with { type: "json" };
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { withLicense } from "next-license-list/config";
import dotenv from "dotenv";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

const coreJsVersion = parentPackageJson.devDependencies["core-js"]
  .split(".")
  .slice(0, 2)
  .join(".");
const workerBabelRc = JSON.parse(
  readFileSync(join(dirname(process.cwd()), "worker", ".babelrc"), "utf-8")
);
const workerBabelCoreJsVersion = workerBabelRc.presets[0][1].corejs;
if (coreJsVersion !== workerBabelCoreJsVersion) {
  // https://github.com/babel/babel/issues/15412
  throw new Error(
    `core-js version in worker/.babelrc (${workerBabelCoreJsVersion}) must be exactly the same as that of installed (${coreJsVersion})`
  );
}

// development時にはswcを使い、productionではcore-jsを設定したbabelを使う
if (process.env.NODE_ENV === "development") {
  if (existsSync(".babelrc")) {
    unlinkSync(".babelrc");
  }
} else {
  const babelRc = {
    "presets": [
      [
        "next/babel",
        {
          "preset-env": {
            "useBuiltIns": "usage",
            "corejs": workerBabelCoreJsVersion,
          },
        },
      ],
    ],
  };
  writeFileSync(".babelrc", JSON.stringify(babelRc), "utf8");
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
  buildVersion:
    packageJson.version.split(".").slice(0, 2).join(".") +
    (process.env.VERSION_SUFFIX ||
      (process.env.NODE_ENV === "development" ? "+dev" : "")),
  browserslist: packageJson.browserslist.join(", "),
  TITLE_SUFFIX:
    process.env.TITLE_SUFFIX ||
    (process.env.NODE_ENV === "development" ? "Development" : ""),
  // prefix for every asset URL
  ASSET_PREFIX: process.env.ASSET_PREFIX || "",
  // prefix for every API call URL
  BACKEND_PREFIX: process.env.BACKEND_PREFIX || "",
  // if not empty, disable all Next.js Link prefetch
  // use prefetch=auto instead of true dut to a bug in Next.js16: https://github.com/vercel/next.js/issues/92341
  PREFETCH: process.env.NO_PREFETCH ? false : "auto",
  // suffix for icon assets
  ASSET_QUERY_ICON: "?v=4",
  ASSET_QUERY_NIKOCHAN: "?v=2",
  ASSET_QUERY_CLOUD: "?v=2",
  // Sentry DSN (make available to client-side code)
  SENTRY_DSN: process.env.SENTRY_DSN || "",
  SENTRY_SEND_PII: process.env.SENTRY_SEND_PII || "",
};
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("env: ", env);
writeFileSync(
  join(process.cwd(), "public/buildVer.json"),
  JSON.stringify({ date, commit, version: env.buildVersion }),
  "utf-8"
);

copyFileSync(
  join(dirname(process.cwd()), "LICENSE"),
  join(process.cwd(), "public/LICENSE")
);

let nextConfig = {
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
  sassOptions: {
    // pretty-checkbox と keyboard-css が出すwarning
    silenceDeprecations: [
      "import",
      "legacy-js-api",
      "global-builtin",
      "color-functions",
      "slash-div",
    ],
  },
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
        rules: (config.module?.rules || [])
          .map((r) => ({
            ...r,
            // https://github.com/vercel/next.js/issues/74743
            exclude: (r.exclude || []).concat([/core-js/]),
          }))
          .concat([
            {
              resourceQuery: /raw/,
              type: "asset/source",
            },
          ]),
      },
    };
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});
nextConfig = withMDX(nextConfig);

nextConfig = withLicense(nextConfig, {
  includeNoticeText: true,
  excludedPackageTest: (packageName /*, version*/) => {
    return packageName.startsWith("@falling-nikochan");
  },
  includePackages: () =>
    ["tailwindcss", "pretty-checkbox", "keyboard-css", "fn-commands"].map(
      (pkg) =>
        dirname(fileURLToPath(import.meta.resolve(`${pkg}/package.json`)))
    ),
});

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sentryUrl: process.env.SENTRY_URL || undefined,
  silent: true,
  // server-side auto-instrumentation is not applicable for static export
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,
  disableLogger: true,
});
