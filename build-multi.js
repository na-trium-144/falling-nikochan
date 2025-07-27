import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, rmdirSync } from "node:fs";

/*
webpackのbuildのたびにファイルのハッシュが異なる場合があるため、
複数回ビルドして現在のリリースビルドに最も近いものを採用する
https://github.com/webpack/webpack/issues/17757
*/

const previousStaticFilesList = await fetch(
  "https://nikochan.utcode.net/assets/staticFiles.json"
).then((res) => res.json());

const maxRetry = 5;
let minDiff = null;

for (let i = 0; i < maxRetry; i++) {
  console.log(`Attempt ${i + 1} to build frontend...`);
  if (typeof Bun !== "undefined") {
    execFileSync("bun", ["nbuild"], { stdio: "inherit" });
    execFileSync("bun", ["swbuild"], { stdio: "inherit" });
  } else {
    execFileSync("npm", ["run", "nbuild"], { stdio: "inherit" });
    execFileSync("npm", ["run", "swbuild"], { stdio: "inherit" });
  }
  const staticFilesList = JSON.parse(
    readFileSync("frontend/out/assets/staticFiles.json", "utf-8")
  );
  const numDiff = staticFilesList.filter((file) => {
    return !previousStaticFilesList.includes(file);
  }).length;
  console.log(
    `Found ${numDiff} new files in this build compared to the previous release.`
  );
  if (minDiff === null || numDiff < minDiff) {
    console.log("This build is the best candidate so far.");
    minDiff = numDiff;
    // Rename the output directory to include the attempt number
    if (existsSync("frontend/out-best")) {
      rmdirSync("frontend/out-best", { recursive: true });
    }
    renameSync("frontend/out", "frontend/out-best");
  }
}

if (existsSync("frontend/out")) {
  rmdirSync("frontend/out", { recursive: true });
}
renameSync("frontend/out-best", "frontend/out");
