import PlayTab from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import { SharePageModalProvider } from "@/common/sharePageModal.jsx";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.play");
  return initMetadata(params, "/main/play", t("title"), t("description"));
}

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  return (
    <SharePageModalProvider locale={locale} from="play">
      <PlayTab locale={locale} />
    </SharePageModalProvider>
  );
}
