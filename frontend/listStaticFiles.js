import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const baseDir = join(process.cwd(), "out");
function listFilesRecursively(dir) {
  let results = [];
  for (const file of readdirSync(join(baseDir, dir), { withFileTypes: true })) {
    const filePath = join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(listFilesRecursively(filePath));
    } else {
      results.push("/" + filePath);
    }
  }
  return results;
}

writeFileSync(
  "out/assets/staticFiles.json",
  JSON.stringify(listFilesRecursively("")),
  "utf-8",
);
