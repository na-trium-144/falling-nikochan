import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import { DevPage } from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "dev");
  return initMetadata(params, null, t("title"), t("description"));
}

export default async function Page({ params }: MetadataProps) {
  return <DevPage locale={(await params).locale} />;
}
