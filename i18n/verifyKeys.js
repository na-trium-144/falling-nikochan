import { readdir } from "node:fs/promises";
import { locales } from "./dynamic.js";
import { getMessages as staticGetMessages } from "./staticMin.js";
import { basename } from "node:path";
const actualLocales = (await readdir(".", { withFileTypes: true }))
  .filter((file) => file.isDirectory())
  .map((dir) => dir.name);
if (actualLocales.length !== locales.length) {
  throw new Error(
    `locales in i18n/index.js ${locales} do not match actual locales ${actualLocales}`
  );
}
for (const locale of locales) {
  staticGetMessages(locale);
}
function listKeys(dict, prefix = "") {
  let keys = [];
  for (const key in dict) {
    if (typeof dict[key] === "object") {
      keys = keys.concat(listKeys(dict[key], prefix + key + "."));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys;
}
const files = (await readdir("ja"))
  .filter((name) => name.endsWith(".js"))
  .map((name) => basename(name));
async function getKeys(locale) {
  return (
    await Promise.all(
      files.map(async (file) =>
        listKeys((await import(`./${locale}/${file}`)).default)
      )
    )
  ).flat();
}
const keysJa = await getKeys("ja");
const errors = [];
for (const locale of locales) {
  const keys = await getKeys(locale);
  for (const key of keysJa) {
    if (!keys.includes(key)) {
      errors.push(`key ${key} does not exist in ${locale}`);
    }
  }
  for (const key of keys) {
    if (!keysJa.includes(key)) {
      errors.push(`key ${key} does not exist in ja`);
    }
  }
}
if (errors.length > 0) {
  throw new Error(errors.join("\n"));
}
