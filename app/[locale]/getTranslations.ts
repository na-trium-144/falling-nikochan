import { createTranslator } from "next-intl";

interface TranslatorOptions {
  locale: string;
  namespace?: string;
}

export const getTranslations = async (config: TranslatorOptions) => {
  const { locale, namespace } = config;
  const messagesModule = await import(`../i18n/${locale}.json`);

  const translator = createTranslator({
    locale,
    messages: messagesModule.default,
    namespace,
  });

  return translator.rich;
};
