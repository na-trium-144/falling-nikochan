import { IndexMain } from "../../main.js";
import { initMetadata } from "@/metadata.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import { importGuideMDX } from "@falling-nikochan/i18n/mdx";
import { Pager } from "@/common/pager.js";
import { notFound } from "next/navigation";

const maxIndex = 7;

export interface GuideProps {
  params: Promise<{ locale: string; index: string }>;
}

export async function generateStaticParams() {
  return Array.from({ length: maxIndex }, (_, i) => ({
    index: String(i + 1),
  }));
}

export async function generateMetadata({ params }: GuideProps) {
  const index = Number((await params).index);
  const t = await getTranslations(params, "edit.guide");
  return initMetadata(params, `/main/guide/${index}`, t(`titles.${index}`), "");
}

export default async function GuidePage({ params }: GuideProps) {
  const { locale, index: indexStr } = await params;
  const index = Number(indexStr);
  const guideComponents = await importGuideMDX(locale);
  const Content = guideComponents[index - 1];
  if (!Content) {
    notFound();
  }
  const t = await getTranslations(params, "edit.guide");

  return (
    <IndexMain
      title={t(`titles.${index}`)}
      tabKey="edit"
      mobileTabKey="edit"
      locale={locale}
      classNameInner="fn-mdx-policies"
    >
      <Pager
        index={index}
        maxIndex={maxIndex}
        title={t(`titles.${index}`)}
        hrefBefore={
          index > 1 ? `/${locale}/main/guide/${index - 1}` : undefined
        }
        hrefAfter={
          index < maxIndex ? `/${locale}/main/guide/${index + 1}` : undefined
        }
      />
      <Content />
    </IndexMain>
  );
}
