import LinksPage from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@falling-nikochan/i18n";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.links");
  return initMetadata(params, "/main/links", t("title"), t("description"));
}

export default async function Page({ params }: MetadataProps) {
  return <LinksPage locale={(await params).locale} />;
}
