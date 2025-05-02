import type { Metadata } from "next";
import { getTranslations, locales } from "@falling-nikochan/i18n";
import { titleWithoutSiteName, titleWithSiteName } from "./common/title.js";

export interface MetadataProps {
  params: Promise<{ locale: string }>;
}

export async function initMetadata(
  params: Promise<{ locale?: string }>,
  path: string | null,
  title: string,
  options?: {
    image?: string;
    noAlternate?: boolean;
    description?: string;
    custom?: { [key: string]: string };
  },
): Promise<Metadata> {
  const locale = (await params).locale || "en";
  const t = await getTranslations(locale, "main");
  const description =
    options?.description !== undefined
      ? options?.description
      : t("description");
  const imageUrl =
    options?.image || process.env.ASSET_PREFIX + "/assets/ogTemplateTitle.png";
  return {
    metadataBase: new URL("https://nikochan.utcode.net"),
    title: titleWithSiteName(title),
    alternates: path
      ? {
          canonical: path,
          languages: options?.noAlternate
            ? {}
            : locales.reduce(
                (prev, locale) => {
                  prev[locale] = `/${locale}${path}`;
                  return prev;
                },
                {} as { [key: string]: string },
              ),
        }
      : undefined,
    description,
    generator: "Next.js",
    applicationName: "Falling Nikochan",
    referrer: "origin-when-cross-origin",
    appleWebApp: true,
    icons: {
      // これを1つでも書くと /app にファイルを置く metadata API が無効になるっぽい?
      icon: process.env.ASSET_PREFIX + "/assets/icon.png",
      apple: [192, 256, 512, 1024].map((size) => ({
        url: process.env.ASSET_PREFIX + `/assets/app-icon-${size}-any.png`,
        size: `${size}x${size}`,
      })),
      shortcut: "/favicon.ico",
    },
    openGraph: path
      ? {
          title: titleWithoutSiteName(title),
          description,
          url: path,
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
            },
          ],
          type: "website",
          locale: options?.noAlternate ? undefined : locale,
          siteName: "Falling Nikochan",
        }
      : undefined,
    twitter: path
      ? {
          title: titleWithSiteName(title),
          card: options?.image ? "summary_large_image" : "summary",
          description,
          images: [imageUrl],
        }
      : undefined,
    robots: {
      index: path ? true : false,
      follow: path ? true : false,
      nocache: true,
    },
    other: options?.custom,
  };
}
