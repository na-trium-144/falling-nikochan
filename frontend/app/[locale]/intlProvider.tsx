"use client";
// https://medium.com/@kitagolda/next-js-v13-multilingual-server-components-adding-internationalization-in-a-statically-exported-a94e1c927d49

import { NextIntlClientProvider } from "next-intl";

function IntlProvider({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, string>;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export default IntlProvider;
