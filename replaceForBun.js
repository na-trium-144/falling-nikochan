import { Glob } from "bun";
import Bun from "bun";
import path from "node:path";

const directories = ["./chart/tests", "./route/tests"];
const patterns = ["**/*.spec.ts"];

async function run() {
  console.log("Starting replacement for bun:test compatibility...");

  const files = [];

  for (const dir of directories) {
    for (const pattern of patterns) {
      const glob = new Glob(pattern);

      for await (const file of glob.scan({ cwd: dir })) {
        // glob.scanはcwdからの相対パスを返すため、dirと結合する
        files.push(path.join(dir, file));
      }
    }
  }

  if (files.length === 0) {
    console.log(
      `No test files found in ${directories.join(", ")} with patterns ${patterns.join(", ")}.`
    );
    return;
  }

  console.log(`Found ${files.length} files to process.`);

  for (const file of files) {
    try {
      const fileRef = Bun.file(file);
      let content = await fileRef.text();
      const originalContent = content;

      // 1. Replace "node:test" with "bun:test"
      content = content.replace(/"node:test"/g, '"bun:test"');

      // 2. Replace test("name", {skip: ...}, ...) with test.skipIf(...)("name", ...)
      const skipRegex = /test\(([^,]+),\s*\{[^}]*skip:\s*([^,}]+)[^}]*\},\s*/g;
      content = content.replace(skipRegex, "test.skipIf($2)($1, ");

      if (content !== originalContent) {
        await Bun.write(file, content); // Bun.writeを使用
        console.log(`Updated ${file}`);
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }
  console.log("Replacement process finished.");
}

run();
