import { readdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

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

// Create a 512-byte POSIX ustar tar header for a regular file.
// Supports paths up to 255 bytes by splitting into prefix+name fields.
function createTarHeader(name, size) {
  const header = Buffer.alloc(512, 0);
  const nameBytes = Buffer.from(name, "utf8");
  let nameBuf, prefixBuf;
  if (nameBytes.length <= 99) {
    nameBuf = nameBytes;
    prefixBuf = Buffer.alloc(0);
  } else {
    // Split at the last '/' that keeps the name part ≤ 99 bytes
    const separatorIdx = name.lastIndexOf("/", 99);
    if (separatorIdx < 1 || name.length - separatorIdx - 1 > 99) {
      throw new Error(`Path too long for ustar tar (>255 bytes): ${name}`);
    }
    nameBuf = Buffer.from(name.slice(separatorIdx + 1), "utf8");
    prefixBuf = Buffer.from(name.slice(0, separatorIdx), "utf8");
    if (prefixBuf.length > 154) {
      throw new Error(`Path too long for ustar tar (>255 bytes): ${name}`);
    }
  }
  // name (0-99): null-terminated
  nameBuf.copy(header, 0, 0, 100);
  // mode (100-107)
  Buffer.from("0000644\0").copy(header, 100);
  // uid (108-115)
  Buffer.from("0000000\0").copy(header, 108);
  // gid (116-123)
  Buffer.from("0000000\0").copy(header, 116);
  // size (124-135): octal, null-terminated
  Buffer.from(size.toString(8).padStart(11, "0") + "\0").copy(header, 124);
  // mtime (136-147): octal + space (GNU-compatible)
  Buffer.from(
    Math.floor(Date.now() / 1000)
      .toString(8)
      .padStart(11, "0") + " "
  ).copy(header, 136);
  // checksum (148-155): fill with spaces before computing
  header.fill(0x20, 148, 156);
  // typeflag (156): '0' = regular file
  header[156] = 0x30;
  // magic (257-262): ustar\0 (POSIX)
  Buffer.from("ustar\0").copy(header, 257);
  // version (263-264): 00
  Buffer.from("00").copy(header, 263);
  // prefix (345-499): directory portion for long paths
  if (prefixBuf.length > 0) prefixBuf.copy(header, 345, 0, 155);
  // compute and write checksum: 6-digit octal + \0 + space (8 bytes)
  let checksum = 0;
  for (let i = 0; i < 512; i++) checksum += header[i];
  Buffer.from(checksum.toString(8).padStart(6, "0") + "\0 ").copy(header, 148);
  return header;
}

// Build a tar archive Buffer from an array of { name, data } objects
function createTar(files) {
  const chunks = [];
  for (const { name, data } of files) {
    chunks.push(createTarHeader(name, data.length));
    chunks.push(data);
    // Pad data to 512-byte boundary
    const padLen = (512 - (data.length % 512)) % 512;
    if (padLen > 0) chunks.push(Buffer.alloc(padLen, 0));
  }
  // End-of-archive: two 512-byte zero blocks
  chunks.push(Buffer.alloc(1024, 0));
  return Buffer.concat(chunks);
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
const tarFiles = archiveFiles.map((filePath) => ({
  name: filePath.slice(1), // remove leading '/'
  data: readFileSync(join(baseDir, filePath.slice(1))),
}));
writeFileSync("out/assets/staticFiles.tar.gz", gzipSync(createTar(tarFiles)));
