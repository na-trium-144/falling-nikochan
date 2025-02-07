import { createTranslator } from "next-intl";

export async function getMessages(locale: string) {
  const messageModule = await import(`../i18n/${locale}.json`);
  return messageModule.default;
}

export async function getTranslations(params: Promise<{ locale: string }>, namespace?: string) {
  const locale = (await params).locale;
  const translator = createTranslator({
    locale,
    messages: await getMessages(locale),
    namespace,
  });
  return translator;
}
