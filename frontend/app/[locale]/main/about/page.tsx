import { IndexMain } from "../main.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import { importAboutMDX } from "@falling-nikochan/i18n/mdx";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.about");
  return initMetadata(params, "/main/about", t("title"), "");
}

export default async function PolicyTab({ params }: MetadataProps) {
  const locale = (await params).locale;
  const About = await importAboutMDX(locale);
  const t = await getTranslations(params, "main.about");
  return (
    <IndexMain
      title={t("title")}
      tabKey="policies"
      mobileTabKey="links"
      locale={locale}
      classNameInner="fn-mdx-policies"
    >
      <About />
    </IndexMain>
  );
}
