import NewTopPage from "./clientPage.js";
import { SharePageModalProvider } from "../common/sharePageModal.jsx";
import { MetadataProps, initMetadata } from "../metadata.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.newTopPage");
  return initMetadata(params, "/newTopPage", t("title"), t("description"));
}

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;

  return (
    <SharePageModalProvider locale={locale} from="newTopPage">
      <NewTopPage locale={locale} />
    </SharePageModalProvider>
  );
}
