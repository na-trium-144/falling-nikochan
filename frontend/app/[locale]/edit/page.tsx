import EditAuth from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import { importGuideMDX } from "@falling-nikochan/i18n/mdx";
import { FC, ReactNode } from "react";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "edit");
  return initMetadata(params, "/edit", t("titleShort"), t("description"));
}

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  const guideContents = ([null] as ReactNode[]).concat(
    (await importGuideMDX(locale)).map((Content: FC, i) => <Content key={i} />),
  );
  return <EditAuth locale={locale} guideContents={guideContents} />;
}
