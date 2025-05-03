import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@falling-nikochan/i18n";
import ChartListPage from "../chartList";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.play");
  return initMetadata(params, "/main/latest", t("latest"), t("latestDesc"));
}

export default async function Page({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.play");
  return (
    <ChartListPage
      locale={(await params).locale}
      title={t("latest")}
      type="latest"
      tabKey="play"
      mobileTabKey="play"
      dateDiff
      badge
    />
  );
}
