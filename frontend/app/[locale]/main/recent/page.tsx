import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import ChartListPage from "../chartList";
import { SharePageModalProvider } from "@/common/sharePageModal";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.play");
  return initMetadata(params, "/main/recent", t("recent"), "");
}

export default async function Page({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.play");
  const locale = (await params).locale;
  return (
    <SharePageModalProvider locale={locale} from="top">
      <ChartListPage
        locale={locale}
        title={t("recent")}
        type="recent"
        tabKey={null}
        mobileTabKey="top"
        badge
      />
    </SharePageModalProvider>
  );
}
