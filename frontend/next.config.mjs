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
import packageJson from "./package.json" with { type: "json" };
import parentPackageJson from "../package.json" with { type: "json" };
import LicensePlugin from "webpack-license-plugin";
import { join, dirname } from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

const coreJsVersion = parentPackageJson.devDependencies["core-js"]
  .slice(1)
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
  NO_PREFETCH: process.env.NO_PREFETCH || "",
  // suffix for icon assets
  ASSET_QUERY_ICON: "?v=4",
  ASSET_QUERY_NIKOCHAN: "?v=2",
  ASSET_QUERY_CLOUD: "?v=2",
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
      plugins: [
        ...config.plugins,
        ...(process.env.NODE_ENV !== "development"
          ? [
              new LicensePlugin({
                outputFilename: "../public/oss-licenses/frontend.json",
                includeNoticeText: true,
                excludedPackageTest: (packageName /*, version*/) => {
                  return packageName.startsWith("@falling-nikochan");
                },
                includePackages: () =>
                  ["tailwindcss", "pretty-checkbox", "keyboard-css"].map(
                    (pkg) => {
                      const currentDirPkg = join(
                        process.cwd(),
                        "node_modules",
                        pkg
                      );
                      const parentDirPkg = join(
                        dirname(process.cwd()),
                        "node_modules",
                        pkg
                      );
                      if (existsSync(currentDirPkg)) {
                        return currentDirPkg;
                      } else if (existsSync(parentDirPkg)) {
                        return parentDirPkg;
                      } else {
                        throw new Error(
                          `Cannot find package ${pkg} to include in OSS licenses`
                        );
                      }
                    }
                  ),
              }),
            ]
          : []),
      ],
    };
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});
export default withMDX(nextConfig);
