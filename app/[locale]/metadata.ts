import type { Metadata } from "next";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

export async function locales() {
  try {
    const files = await readdir(join(process.cwd(), "app", "i18n"), {
      withFileTypes: true,
    });
    return files.filter((ent) => ent.isDirectory()).map((ent) => ent.name);
  } catch (err) {
    console.error("Unable to scan directory: " + err);
    return [];
  }
}

const description =
  "Simple and cute rhythm game, where anyone can create and share charts.";

export interface MetadataProps {
  params: Promise<{ locale: string }>;
}

export async function initMetadata(
  params: Promise<{ locale: string }>,
  path: string | null,
  title: string
): Promise<Metadata> {
  const locale = (await params).locale;
  const titleWithSiteName = title
    ? `${title} | Falling Nikochan`
    : "Falling Nikochan";
  const titleWithoutSiteName = title || "Falling Nikochan";
  return {
    metadataBase: new URL("https://nikochan.natrium144.org"),
    title: titleWithSiteName,
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
          title: titleWithoutSiteName,
          description,
          // todo: images
          type: "website",
          locale,
          siteName: "Falling Nikochan",
        }
      : undefined,
    twitter: path
      ? {
          title: titleWithSiteName,
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
