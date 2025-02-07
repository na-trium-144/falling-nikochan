import { createTranslator } from "next-intl";

export async function getMessages(locale: string) {
  return {
    ...(await import(`../i18n/${locale}/main.json`)).default,
  };
}

export async function getTranslations(
  params: Promise<{ locale: string }>,
  namespace?: string
) {
  const locale = (await params).locale;
  const translator = createTranslator({
    locale,
    messages: await getMessages(locale),
    namespace,
  });
  return translator;
}
