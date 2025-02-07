import PlayTab from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@/getTranslations.js";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.play");
  return initMetadata(params, "/main/play", t("title"));
}

export default async function Page({ params }: MetadataProps) {
  return <PlayTab locale={(await params).locale} />;
}
