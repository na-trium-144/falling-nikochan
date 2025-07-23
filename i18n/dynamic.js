import { createTranslator } from "next-intl";

export const locales = ["en", "ja"];

export async function getMessages(locale) {
  return {
    ...(await import(`./${locale}/main.js`)).default,
    ...(await import(`./${locale}/about.js`)).default,
    ...(await import(`./${locale}/share.js`)).default,
    ...(await import(`./${locale}/play.js`)).default,
    ...(await import(`./${locale}/edit.js`)).default,
    ...(await import(`./${locale}/error.js`)).default,
  };
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
