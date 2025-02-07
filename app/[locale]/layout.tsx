import "./globals.css";
import { description, ogDefault, twitterDefault } from "./common/title.js";
import IntlProvider from "./intlProvider.js";
import { locales } from "./metadata.js";

export async function generateStaticParams() {
  return (await locales()).map((locale) => ({ locale }));
}

export async function generateMetadata() {
  return {
    metadataBase: new URL("https://nikochan.natrium144.org"),
    title: {
      template: "%s | Falling Nikochan",
      default: "Falling Nikochan",
    },
    alternates: {
      canonical: "./",
      languages: (await locales()).reduce((prev, locale) => {
        prev[locale] = `./${locale}`;
        return prev;
      }, {} as { [key: string]: string }),
    },
    description,
    generator: "Next.js",
    applicationName: "Falling Nikochan",
    referrer: "origin-when-cross-origin",
    icons: {
      // これを1つでも書くと /app にファイルを置く metadata API が無効になるっぽい?
      icon: process.env.ASSET_PREFIX + "/assets/icon.png",
      apple: process.env.ASSET_PREFIX + "/assets/apple-icon.png",
      shortcut: "/favicon.ico",
    },
    openGraph: {
      title: {
        template: "%s",
        default: "Falling Nikochan",
      },
      ...ogDefault,
    },
    twitter: {
      title: {
        template: "%s | Falling Nikochan",
        default: "Falling Nikochan",
      },
      ...twitterDefault,
    },
    robots: {
      index: true,
      follow: true,
      nocache: true,
    },
  };
}

// Dynamically import needed messages for given locale
async function getMessages(locale: string) {
  const messageModule = await import(`../i18n/${locale}.json`);

  return messageModule.default;
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  return (
    <html lang={params.locale}>
      <body className="min-w-full min-h-dvh overflow-auto ">
        <IntlProvider
          locale={params.locale}
          messages={await getMessages(params.locale)}
        >
          {children}
        </IntlProvider>
      </body>
    </html>
  );
}
