import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import { InitPlay } from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "play");
  return initMetadata(params, null, "", t("description"));
}
// pageTitle(cid, brief) or `Not Found (ID: ${cid})`

export default async function Page({ params }: MetadataProps) {
  return <InitPlay locale={(await params).locale} />;
}
