import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { parse } from "node:path";
import { toSfnt } from "woff2sfnt-sfnt2woff";
let nodeModulesDir;
if (existsSync("./node_modules/@fontsource")) {
  nodeModulesDir = "./node_modules";
} else if (existsSync("../node_modules/@fontsource")) {
  nodeModulesDir = "../node_modules";
} else {
  throw new Error("node_modules directory not found");
}
for (const [name, file] of [
  ["kaisei-opti", "kaisei-opti-japanese-400-normal.woff"],
  ["merriweather", "merriweather-latin-400-normal.woff"],
  ["noto-sans", "noto-sans-latin-400-normal.woff"],
  ["noto-sans-jp", "noto-sans-jp-japanese-400-normal.woff"],
]) {
  var woff = Buffer.from(
    readFileSync(`${nodeModulesDir}/@fontsource/${name}/files/${file}`)
  );
  writeFileSync(`public/assets/${parse(file).name}.ttf`, toSfnt(woff));
}

copyFileSync(
  `${nodeModulesDir}/wasmoon/dist/glue.wasm`,
  "public/assets/wasmoon_glue.wasm"
);
