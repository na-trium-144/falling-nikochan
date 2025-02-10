import { createTranslator } from "next-intl";

export async function getMessages(locale: string) {
  return {
    ...(await import(`../i18n/${locale}/main.js`)).default,
    ...(await import(`../i18n/${locale}/about.js`)).default,
    ...(await import(`../i18n/${locale}/share.js`)).default,
    ...(await import(`../i18n/${locale}/play.js`)).default,
    ...(await import(`../i18n/${locale}/edit.js`)).default,
  };
}

export async function getTranslations(
  params: Promise<{ locale: string }> | string,
  namespace?: string
) {
  const locale = typeof params === "string" ? params : (await params).locale;
  const translator = createTranslator({
    locale,
    messages: await getMessages(locale),
    namespace,
  });
  return translator;
}
