import { importChangeLogMDX } from "@falling-nikochan/i18n/mdx.js";
import ShareInternal from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(params, null, "", null);
}

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  const ChangeLog = await importChangeLogMDX(locale);
  return (
    <ShareInternal locale={(await params).locale} changeLog={<ChangeLog />} />
  );
}
