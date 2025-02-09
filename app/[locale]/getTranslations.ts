import { createTranslator } from "next-intl";

export async function getMessages(locale: string) {
  return {
    ...(await import(`../i18n/${locale}/main.json`)).default,
    ...(await import(`../i18n/${locale}/about.json`)).default,
    ...(await import(`../i18n/${locale}/share.json`)).default,
    ...(await import(`../i18n/${locale}/play.json`)).default,
    ...(await import(`../i18n/${locale}/edit.json`)).default,
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
