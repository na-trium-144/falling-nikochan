import { getTranslations } from "@/../../i18n/i18n.js";
import ChangelogPage from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.version");
  return initMetadata(params, "/main/version", t("title"));
}
export default async function Page({ params }: MetadataProps) {
  return <ChangelogPage locale={(await params).locale} />;
}
