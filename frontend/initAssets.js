import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { parse } from "node:path";
import { toSfnt } from "woff2sfnt-sfnt2woff";
import {
  ClickTap,
  GameThree,
  KeyboardOne,
  MouseOne,
  Write,
} from "@icon-park/svg";
import { p256 } from "@noble/curves/nist.js";
import { p256 as webcryptoP256 } from "@noble/curves/webcrypto.js";
let nodeModulesDir;
if (existsSync("./node_modules/@fontsource")) {
  nodeModulesDir = "./node_modules";
} else if (existsSync("../node_modules/@fontsource")) {
  nodeModulesDir = "../node_modules";
} else {
  throw new Error("node_modules directory not found");
}
if (!existsSync("public/og-fonts")) {
  mkdirSync("public/og-fonts");
}
for (const [name, file] of [
  ["kaisei-opti", "kaisei-opti-japanese-400-normal.woff"],
  ["merriweather", "merriweather-latin-400-normal.woff"],
]) {
  var woff = Buffer.from(
    readFileSync(`${nodeModulesDir}/@fontsource/${name}/files/${file}`)
  );
  writeFileSync(`public/og-fonts/${parse(file).name}.ttf`, toSfnt(woff));
}

copyFileSync(
  `${nodeModulesDir}/wasmoon/dist/glue.wasm`,
  "public/wasmoon_glue.wasm"
);

if (!existsSync("public/og-icons")) {
  mkdirSync("public/og-icons");
}
const slate500 = "#62748e";
writeFileSync(
  "public/og-icons/click-tap.svg",
  ClickTap({ size: 24, fill: slate500 }),
  "utf8"
);
writeFileSync(
  "public/og-icons/game-three.svg",
  GameThree({ size: 24, fill: slate500 }),
  "utf8"
);
writeFileSync(
  "public/og-icons/keyboard-one.svg",
  KeyboardOne({ size: 24, fill: slate500 }),
  "utf8"
);
writeFileSync(
  "public/og-icons/mouse-one.svg",
  MouseOne({ size: 24, fill: slate500 }),
  "utf8"
);
writeFileSync(
  "public/og-icons/write.svg",
  Write({ size: 24, fill: slate500 }),
  "utf8"
);

// Generate ephemeral BuildKey for this build (/api/resultSigning step 2)
const resultBuildPrivKey = p256.utils.randomSecretKey();
const resultBuildPubKeyJwk = await webcryptoP256.getPublicKey(
  resultBuildPrivKey,
  {
    formatSec: "raw",
    formatPub: "jwk",
  }
);
writeFileSync(
  "public/resultBuildKey.json",
  JSON.stringify(resultBuildPubKeyJwk),
  "utf8"
);
writeFileSync(".resultBuildPrivKey", Buffer.from(resultBuildPrivKey));
if (!existsSync("out")) {
  mkdirSync("out");
}
// for backend development server
copyFileSync("public/resultBuildKey.json", "out/resultBuildKey.json");
