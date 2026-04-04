import { readdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { TarWriter } from "@gera2ld/tarjs";

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

const allFiles = listFilesRecursively("");

// _next/ files: still downloaded individually by the Service Worker
const nextFiles = allFiles.filter((n) => n.startsWith("/_next"));

// Non-_next files for tar.gz archive (excluding .ttf and ogTemplate, matching entry.ts)
const archiveFiles = allFiles
  .filter((n) => !n.startsWith("/_next"))
  .filter((n) => !n.endsWith(".ttf"))
  .filter((n) => !n.includes("ogTemplate"));

// Write staticFiles.json with only _next/ file paths for individual download
writeFileSync(
  "out/assets/staticFiles.json",
  JSON.stringify(nextFiles),
  "utf-8"
);

// Build tar archive and gzip-compress it, then write to disk
const writer = new TarWriter();
for (const filePath of archiveFiles) {
  const data = readFileSync(join(baseDir, filePath.slice(1)));
  writer.addFile(filePath.slice(1), data.buffer); // remove leading '/'
}
const blob = await writer.write();
writeFileSync(
  "out/assets/staticFiles.tar.gz",
  gzipSync(Buffer.from(await blob.arrayBuffer()))
);
