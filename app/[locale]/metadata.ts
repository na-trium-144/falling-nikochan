import type { Metadata } from "next";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

export async function locales() {
  try {
    const files = await readdir(join(process.cwd(), "app", "i18n"));
    return files.map((name) => name.split(".")[0]);
  } catch (err) {
    console.error("Unable to scan directory: " + err);
    return [];
  }
}

const description =
  "Simple and cute rhythm game, where anyone can create and share charts.";

export async function initMetadata(path: string, title: string): Promise<Metadata> {
  const titleWithSiteName = title
    ? `${title} | Falling Nikochan`
    : "Falling Nikochan";
  const titleWithoutSiteName = title || "Falling Nikochan";
  return {
    metadataBase: new URL("https://nikochan.natrium144.org"),
    title: titleWithSiteName,
    alternates: {
      canonical: path,
      languages: (await locales()).reduce((prev, locale) => {
        prev[locale] = `/${locale}${path}`;
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
      title: titleWithoutSiteName,
      description,
      // todo: images
      type: "website",
      locale: "ja_JP",
      siteName: "Falling Nikochan",
    },
    twitter: {
      title: titleWithSiteName,
      card: "summary",
      description,
      // images
    },
    robots: {
      index: true,
      follow: true,
      nocache: true,
    },
  };
}
