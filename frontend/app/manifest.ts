import { getTranslations } from "@falling-nikochan/i18n";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("en", "main");
  return {
    name: "Falling Nikochan",
    short_name: "Nikochan",
    description: t("description"),
    icons: [
      {
        src: "/assets/app-icon-256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/assets/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/assets/app-icon-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    theme_color: "#ffba00",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    scope: "/",
  };
}
