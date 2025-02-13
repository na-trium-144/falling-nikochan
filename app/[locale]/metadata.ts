import type { Metadata } from "next";
import { getTranslations, locales } from "../../i18n/i18n.js";

export interface MetadataProps {
  params: Promise<{ locale: string }>;
}

export const titleWithSiteName = (title: string) =>
  title ? `${title} | Falling Nikochan` : "Falling Nikochan";
export const titleWithoutSiteName = (title: string) =>
  title || "Falling Nikochan";

export async function initMetadata(
  params: Promise<{ locale?: string }>,
  path: string | null,
  title: string
): Promise<Metadata> {
  const locale = (await params).locale || "en";
  const t = await getTranslations(locale, "main");
  const description = t("description");
  return {
    metadataBase: new URL("https://nikochan.natrium144.org"),
    title: titleWithSiteName(title),
    alternates: path
      ? {
          canonical: path,
          languages: (await locales()).reduce((prev, locale) => {
            prev[locale] = `/${locale}${path}`;
            return prev;
          }, {} as { [key: string]: string }),
        }
      : undefined,
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
    openGraph: path
      ? {
          title: titleWithoutSiteName(title),
          description,
          // todo: images
          type: "website",
          locale,
          siteName: "Falling Nikochan",
        }
      : undefined,
    twitter: path
      ? {
          title: titleWithSiteName(title),
          card: "summary",
          description,
          // images
        }
      : undefined,
    robots: {
      index: path ? true : false,
      follow: path ? true : false,
      nocache: true,
    },
  };
}
