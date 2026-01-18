"use client";
// https://medium.com/@kitagolda/next-js-v13-multilingual-server-components-adding-internationalization-in-a-statically-exported-a94e1c927d49

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@falling-nikochan/i18n/dynamic";

function IntlProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={getMessages(locale)}>
      {children}
    </NextIntlClientProvider>
  );
}

export default IntlProvider;
