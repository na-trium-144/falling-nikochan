import type { Metadata, Viewport } from "next";
import { getTranslations, locales } from "@falling-nikochan/i18n/dynamic";
import { titleWithoutSiteName, titleWithSiteName } from "./common/title.js";

export const backgroundColorLight = "#f0f9ff"; // sky-50
export const themeColorLight = "#b8e6fe"; // sky-200
export const backgroundColorDark = "#441306"; // orange-950
export const themeColorDark = "#20100a"; // orange-975

export function initViewport(): Viewport {
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: themeColorLight },
      { media: "(prefers-color-scheme: dark)", color: themeColorDark },
    ],
  };
}

export const originURL = new URL("https://nikochan.utcode.net");

export interface MetadataProps {
  params: Promise<{ locale: string }>;
}
export async function initMetadata(
  params: Promise<{ locale?: string }>,
  path: string | null,
  title: string,
  description: string | null,
  options?: {
    image?: string;
    noAlternate?: boolean;
    custom?: { [key: string]: string };
  }
): Promise<Metadata> {
  const locale = (await params).locale || "en";
  const t = await getTranslations(locale, "main");
  if (description === null) {
    description = t("description");
  }
  const imageUrl =
    options?.image || process.env.ASSET_PREFIX + "/assets/ogTemplateTitle.png";
  return {
    metadataBase: originURL,
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
                {} as { [key: string]: string }
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
      icon: {
        url: process.env.ASSET_PREFIX + "/assets/icon.png?v=2",
        sizes: "256x256",
        type: "image/png",
      },
      apple: [192, 256, 512, 1024].map((size) => ({
        url: process.env.ASSET_PREFIX + `/assets/app-icon-${size}-any.png?v=2`,
        sizes: `${size}x${size}`,
        type: "image/png",
      })),
      shortcut: {
        url: "/favicon.ico?v=2",
        type: "image/x-icon",
      },
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
