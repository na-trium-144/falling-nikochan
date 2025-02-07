import EditTab from "./clientPage.js";
import { getTranslations } from "@/getTranslations.js";
import { initMetadata, MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.edit");
  return initMetadata(params, "/main/edit", t("title"));
}

export default async function Page({ params }: MetadataProps) {
  return <EditTab locale={(await params).locale} />;
}
