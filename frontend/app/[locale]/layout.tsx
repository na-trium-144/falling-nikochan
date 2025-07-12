import "@fontsource/merriweather/400.css";
import "@fontsource/kaisei-opti/japanese-400.css";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans-jp/japanese-400.css";
import "@/globals.css";
import { getMessages, locales } from "@falling-nikochan/i18n/dynamic";
import IntlProvider from "./intlProvider.js";
import { initMetadata, initViewport, MetadataProps } from "./metadata.js";
import { ThemeProvider } from "./common/theme.jsx";
import { PWAInstallProvider } from "./common/pwaInstall.jsx";
import { ShareImageModalProvider } from "./common/shareLinkAndImage.jsx";
import { ChangeLogProvider } from "./common/changeLog.jsx";
import { importChangeLogMDX } from "@falling-nikochan/i18n/mdx.js";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(params, "/", "", null);
}

export const viewport = initViewport();

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const locale = (await params).locale;
  const ChangeLog = await importChangeLogMDX(locale);
  return (
    <html lang={locale}>
      <body className="w-full h-dvh overflow-hidden touch-none ">
        <IntlProvider locale={locale} messages={await getMessages(locale)}>
          <ThemeProvider>
            <ChangeLogProvider changeLog={<ChangeLog />}>
              <PWAInstallProvider>
                <ShareImageModalProvider>{children}</ShareImageModalProvider>
              </PWAInstallProvider>
            </ChangeLogProvider>
          </ThemeProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
