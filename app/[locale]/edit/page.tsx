import EditAuth from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@/getTranslations.js";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "edit");
  return initMetadata(params, "/edit", t("title"));
}

export default async function Page({ params }: MetadataProps) {
  return <EditAuth locale={(await params).locale} />;
}
