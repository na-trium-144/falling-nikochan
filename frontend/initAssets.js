import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { parse } from "node:path";
import { toSfnt } from "woff2sfnt-sfnt2woff";
for (const [name, file] of [
  ["kaisei-opti", "kaisei-opti-japanese-400-normal.woff"],
  ["merriweather", "merriweather-latin-400-normal.woff"],
  ["noto-sans", "noto-sans-latin-400-normal.woff"],
  ["noto-sans-jp", "noto-sans-jp-japanese-400-normal.woff"],
]) {
  var woff = Buffer.from(
    readFileSync(`../node_modules/@fontsource/${name}/files/${file}`)
  );
  writeFileSync(`public/assets/${parse(file).name}.ttf`, toSfnt(woff));
}

copyFileSync(
  "../node_modules/wasmoon/dist/glue.wasm",
  "public/assets/wasmoon_glue.wasm"
);
