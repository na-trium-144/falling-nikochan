import { createTranslator } from "next-intl";
import enAbout from "./en/about.js";
import enEdit from "./en/edit.js";
import enError from "./en/error.js";
import enMain from "./en/main.js";
import enPlay from "./en/play.js";
import enShare from "./en/share.js";
import jaAbout from "./ja/about.js";
import jaEdit from "./ja/edit.js";
import jaError from "./ja/error.js";
import jaMain from "./ja/main.js";
import jaPlay from "./ja/play.js";
import jaShare from "./ja/share.js";

export const locales = ["en", "ja"];

/**
* @returns {any}
*/
export function getMessages(locale) {
  switch (locale) {
    case "en":
      return {
        ...enAbout,
        ...enEdit,
        ...enError,
        ...enMain,
        ...enPlay,
        ...enShare,
      };
    case "ja":
      return {
        ...jaAbout,
        ...jaEdit,
        ...jaError,
        ...jaMain,
        ...jaPlay,
        ...jaShare,
      };
    default:
      throw new Error(`locale ${locale} is not defined in dynamic.js`);
  }
}

export async function getTranslations(params, namespace) {
  const locale = typeof params === "string" ? params : (await params).locale;
  const translator = createTranslator({
    locale,
    messages: getMessages(locale),
    namespace,
  });
  return translator;
}
