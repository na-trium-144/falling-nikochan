import fs from "node:fs";
import YAML from "yaml";
import semver from "semver";

// 引数から更新タイプを取得 (major, minor, patch)
const updateType = process.argv[2];

// 有効な引数かチェック
const VALID_TYPES = ["major", "minor", "patch"];
if (!VALID_TYPES.includes(updateType)) {
  console.error(
    `❌ エラー: 引数には ${VALID_TYPES.join(", ")} のいずれかを指定してください。`
  );
  console.error("例: node update-version.js minor");
  process.exit(1);
}

const workspacePackages = YAML.parse(
  fs.readFileSync("pnpm-workspace.yaml", "utf8")
).packages;

for (const filePath of [
  "package.json",
  ...workspacePackages.flatMap((pattern) =>
    pattern.endsWith("/") ? `${pattern}package.json` : `${pattern}/package.json`
  ),
]) {
  const pkgContent = fs.readFileSync(filePath, "utf8");
  const pkg = JSON.parse(pkgContent);
  const oldVersion = pkg.version;
  const newVersion = semver.inc(oldVersion, updateType);
  pkg.version = newVersion;
  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`${filePath} (${oldVersion} -> ${newVersion})`);
}
