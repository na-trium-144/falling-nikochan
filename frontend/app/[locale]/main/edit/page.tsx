import EditTab from "./clientPage.js";
import { getTranslations } from "@falling-nikochan/i18n";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { rateLimitMin } from "@falling-nikochan/chart";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.edit");
  return initMetadata(
    params,
    "/main/edit",
    t("title"),
    t("description", { rateLimitMin }),
  );
}

export default async function Page({ params }: MetadataProps) {
  return <EditTab locale={(await params).locale} />;
}
