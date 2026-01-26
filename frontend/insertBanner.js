import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, extname } from "node:path";

const baseDir = join(process.cwd(), "out");
const bannerContent = readFileSync(
  join(dirname(process.cwd()), "license-banner.txt"),
  "utf8"
).trim();

function addBannerToFiles(dir) {
  for (const file of readdirSync(join(baseDir, dir), { withFileTypes: true })) {
    const filePath = join(baseDir, dir, file.name);
    if (file.isDirectory()) {
      addBannerToFiles(join(dir, file.name));
    } else {
      const ext = extname(filePath);
      if (ext === ".js" || ext === ".css") {
        const content = readFileSync(filePath, "utf8");
        // 既にバナーがあるかチェック
        if (!content.includes(bannerContent)) {
          writeFileSync(
            filePath,
            `/*!\n${bannerContent}\n*/\n${content}`,
            "utf8"
          );
        }
      } else if (ext === ".html") {
        const content = readFileSync(filePath, "utf8");
        if (!content.includes(bannerContent)) {
          const newContent = content.replace(
            /<head>/,
            `\n<!--\n${bannerContent}\n-->\n<head>`
          );
          writeFileSync(filePath, newContent, "utf8");
        }
      }
    }
  }
}
addBannerToFiles("");
