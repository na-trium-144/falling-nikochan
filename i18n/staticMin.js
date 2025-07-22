// for service worker where only error message is needed and dynamic import does not work

import { createTranslator } from "next-intl";
import enError from "./en/error.js";
import jaError from "./ja/error.js";

export const locales = ["en", "ja"];
export const localesFull = ["en", "ja", "ja-JP"]; // workaround https://github.com/honojs/hono/issues/4294

export async function getMessages(locale) {
  switch (locale) {
    case "en":
      return enError;
    case "ja":
      return jaError;
    default:
      throw new Error(`locale ${locale} is not defined in staticImport.js`);
  }
}

export async function getTranslations(params, namespace) {
  const locale = typeof params === "string" ? params : (await params).locale;
  const translator = createTranslator({
    locale,
    messages: await getMessages(locale),
    namespace,
  });
  return translator;
}
