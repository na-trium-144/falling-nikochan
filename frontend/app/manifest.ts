import { backgroundColorLight, themeColorLight } from "@/metadata";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("en", "main");
  return {
    name: "Falling Nikochan",
    short_name: "Nikochan",
    description: t("description"),
    icons: [
      ...[192, 512]
        .map((size) => [
          {
            src:
              process.env.ASSET_PREFIX + `/assets/app-icon-${size}-any.png?v=2`,
            sizes: `${size}x${size}`,
            type: "image/png",
            purpose: "any",
          } as const,
          {
            src: process.env.ASSET_PREFIX + `/assets/app-icon-${size}.png?v=2`,
            sizes: `${size}x${size}`,
            type: "image/png",
            purpose: "maskable",
          } as const,
        ])
        .flat(),
      {
        src: process.env.ASSET_PREFIX + "/assets/app-icon-any.svg?v=2",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: process.env.ASSET_PREFIX + "/assets/app-icon.svg?v=2",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    start_url: "/?utm_source=homescreen",
    id: "/",
    display: "standalone",
    orientation: "any",
    scope: "/",
    theme_color: themeColorLight,
    background_color: backgroundColorLight,
  };
}
