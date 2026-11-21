import PlayTab from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import { SharePageModalProvider } from "@/common/sharePageModal.jsx";
import { IndexMainPage } from "../serverMain.js";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.play");
  return initMetadata(params, "/main/play", t("title"), t("description"));
}

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  const t = await getTranslations(params, "main.play");
  return (
    <IndexMainPage
      title={t("title")}
      tabKey="play"
      mobileTabKey="play"
      noBackButtonMobile
      noBackButtonPC
      locale={locale}
    >
      <SharePageModalProvider from="play">
        <PlayTab locale={locale} />
      </SharePageModalProvider>
    </IndexMainPage>
  );
}
