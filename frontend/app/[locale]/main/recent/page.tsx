import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@falling-nikochan/i18n";
import ChartListPage from "../chartList";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.play");
  return initMetadata(params, "/main/recent", t("recent"));
}

export default async function Page({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.play");
  return (
    <ChartListPage
      locale={(await params).locale}
      title={t("recent")}
      type="recent"
      tabKey={null}
      mobileTabKey="top"
      badge
    />
  );
}
