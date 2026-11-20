import { locales } from "@falling-nikochan/i18n/dynamic";
import { initMetadata, initViewport, MetadataProps } from "./metadata.js";
import { ThemeInitializer } from "./common/theme.jsx";
import { PWAInstallInitializer } from "./common/pwaInstall.jsx";
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
  return (
    <html lang={locale}>
      <body className="fn-body" suppressHydrationWarning>
        <ThemeInitializer />
                  <FPSCalculatorProvider>{children}</FPSCalculatorProvider>
            <PWAInstallInitializer />
      </body>
    </html>
  );
}
