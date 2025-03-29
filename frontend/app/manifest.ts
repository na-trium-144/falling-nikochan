import { getTranslations } from "@falling-nikochan/i18n";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("en", "main");
  return {
    name: "Falling Nikochan",
    short_name: "Nikochan",
    description: t("description"),
    // @ts-expect-error purpose: "any maskable" should work
    icons: [192, 256, 512, 1024].map((size) => ({
      src: process.env.ASSET_PREFIX + `/assets/app-icon-${size}.png`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: "any maskable",
    })),
    start_url: "/",
    display: "standalone",
    orientation: "any",
    scope: "/",
  };
}
