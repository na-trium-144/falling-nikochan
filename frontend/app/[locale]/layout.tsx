import { locales } from "@falling-nikochan/i18n/dynamic";
import IntlProvider from "./intlProvider.js";
import { initMetadata, initViewport, MetadataProps } from "./metadata.js";
import { ThemeInitializer } from "./common/theme.jsx";
import { PWAInstallInitializer } from "./common/pwaInstall.jsx";
import { ShareImageModalProvider } from "./common/shareLinkAndImage.jsx";
import { ChangeLogProvider } from "./common/changeLog.jsx";
import { importChangeLogMDX } from "@falling-nikochan/i18n/mdx.js";
import { FPSCalculatorProvider } from "./common/fpsCalculator.jsx";

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
      <body className="fn-body" suppressHydrationWarning>
        <ThemeInitializer />
          <IntlProvider locale={locale}>
            <ChangeLogProvider changeLog={<ChangeLog />}>
                <ShareImageModalProvider>
                  <FPSCalculatorProvider>{children}</FPSCalculatorProvider>
                </ShareImageModalProvider>
            </ChangeLogProvider>
            <PWAInstallInitializer />
          </IntlProvider>
      </body>
    </html>
  );
}
