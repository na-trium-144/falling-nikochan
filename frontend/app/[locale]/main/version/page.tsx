import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import { importChangeLogMDX } from "@falling-nikochan/i18n/mdx";
import ChangelogPage from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.version");
  return initMetadata(params, "/main/version", t("title"), t("description"));
}
export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  const ChangeLog = await importChangeLogMDX(locale);
  return <ChangelogPage locale={locale} changeLog={<ChangeLog />} />;
}
