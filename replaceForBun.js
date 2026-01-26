import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

const directories = ['./chart/tests', './route/tests'];
const patterns = ['**/*.spec.ts'];

async function run() {
  console.log('Starting replacement for bun:test compatibility...');

  const files = [];
  for (const dir of directories) {
    for (const pattern of patterns) {
      const found = await glob(path.join(dir, pattern), {
        ignore: '**/node_modules/**',
      });
      files.push(...found);
    }
  }

  if (files.length === 0) {
    console.log(`No test files found in ${directories.join(', ')} with patterns ${patterns.join(', ')}.`);
    return;
  }

  console.log(`Found ${files.length} files to process.`);

  for (const file of files) {
    try {
      let content = await fs.readFile(file, 'utf-8');
      const originalContent = content;

      // 1. Replace "node:test" with "bun:test"
      content = content.replace(/"node:test"/g, '"bun:test"');

      // 2. Replace test("name", {skip: ...}, ...) with test.skipIf(...)("name", ...)
      // This regex is simple and might not cover all edge cases.
      // It assumes the `skip` condition does not contain commas or curly braces.
      const skipRegex = /test\(([^,]+),\s*\{[^}]*skip:\s*([^,}]+)[^}]*\},\s*/g;
      content = content.replace(skipRegex, 'test.skipIf($2)($1, ');
      
      if (content !== originalContent) {
        await fs.writeFile(file, content, 'utf-8');
        console.log(`Updated ${file}`);
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }

  console.log('Replacement process finished.');
}

run();
