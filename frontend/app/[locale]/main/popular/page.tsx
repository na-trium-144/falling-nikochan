import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import ChartListPage from "../chartList";
import { popularDays } from "@falling-nikochan/chart";
import { SharePageModalProvider } from "@/common/sharePageModal";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.play");
  return initMetadata(
    params,
    "/main/popular",
    t("popular"),
    t("popularDesc", { popularDays })
  );
}

export default async function Page({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.play");
  const locale = (await params).locale;
  return (
    <SharePageModalProvider locale={locale} from="play">
      <ChartListPage
        locale={locale}
        title={t("popular")}
        type="popular"
        tabKey="play"
        mobileTabKey="play"
        badge
      />
    </SharePageModalProvider>
  );
}
