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
  ["noto-sans", "noto-sans-latin-400-normal.woff"],
  ["noto-sans-jp", "noto-sans-jp-japanese-400-normal.woff"],
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

function bytesToBase64Url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

// Generate ephemeral BuildKey for this build
const buildKeyPair = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"]
);
const pubRawBuild = new Uint8Array(
  await crypto.subtle.exportKey("raw", buildKeyPair.publicKey)
);
const privPkcs8Build = new Uint8Array(
  await crypto.subtle.exportKey("pkcs8", buildKeyPair.privateKey)
);
const buildPublicKeyStr = bytesToBase64Url(pubRawBuild);
const buildPrivateKeyStr = bytesToBase64Url(privPkcs8Build);

writeFileSync("public/buildKey.pub", buildPublicKeyStr, "utf8");
const buildKeyJson = JSON.stringify({
  privateKeyStr: buildPrivateKeyStr,
  publicKeyStr: buildPublicKeyStr,
});
writeFileSync(".buildKey.json", buildKeyJson, "utf8");
