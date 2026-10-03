import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import { InitInspect } from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { ButtonKeyDisabler } from "@/common/button.jsx";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "inspect");
  return initMetadata(params, null, "", t("description"));
}

export default async function Page() {
  return (
    <ButtonKeyDisabler>
      <InitInspect />
    </ButtonKeyDisabler>
  );
}
