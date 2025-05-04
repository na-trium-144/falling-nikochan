import "@fontsource/merriweather/400.css";
import "@fontsource/kaisei-opti/japanese-400.css";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans-jp/japanese-400.css";
import "@/globals.css";
import { getMessages, locales } from "@falling-nikochan/i18n";
import IntlProvider from "./intlProvider.js";
import {
  initMetadata,
  MetadataProps,
  themeColorDark,
  themeColorLight,
} from "./metadata.js";
import { ThemeProvider } from "./common/theme.jsx";
import { PWAInstallProvider } from "./common/pwaInstall.jsx";
import type { Viewport } from "next";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(params, "/", "", null);
}

export const viewport: Viewport = {
  themeColor: [
    { color: themeColorLight },
    { media: "(prefers-color-scheme: dark)", color: themeColorDark },
  ],
};

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
      <body className="w-full h-dvh overflow-hidden touch-none ">
        <IntlProvider locale={locale} messages={await getMessages(locale)}>
          <ThemeProvider>
            <PWAInstallProvider>{children}</PWAInstallProvider>
          </ThemeProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
