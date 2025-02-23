import "@fontsource/merriweather/400.css";
import "@fontsource/kaisei-opti/japanese-400.css";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans-jp/japanese-400.css";
import "@/globals.css";
import { getMessages, locales } from "@/../../i18n/i18n.js";
import IntlProvider from "./intlProvider.js";
import { initMetadata, MetadataProps } from "./metadata.js";

export async function generateStaticParams() {
  return (await locales()).map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(params, "/", "");
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const locale = (await params).locale;
  return (
    <html lang={locale}>
      <body className="min-w-full min-h-dvh overflow-auto ">
        <IntlProvider locale={locale} messages={await getMessages(locale)}>
          {children}
        </IntlProvider>
      </body>
    </html>
  );
}
