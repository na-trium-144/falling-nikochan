import { getTranslations } from "@/getTranslations";
import { initMetadata, MetadataProps } from "@/metadata";
import { IndexMain } from "../main.js";
import ChangeLogJa from "@/../i18n/ja/changelog.mdx";
import ChangeLogEn from "@/../i18n/en/changelog.mdx";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.version");
  return initMetadata(params, "/main/version", t("title"));
}

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  const t = await getTranslations(params, "main.version");

  return (
    <IndexMain tab={4} locale={locale}>
      <div className="mb-2">
        <span className="inline-block">Falling Nikochan</span>
        <span className="inline-block">
          <span className="ml-2">ver.</span>
          <span className="ml-1">{process.env.buildVersion}</span>
          {process.env.buildCommit && (
            <span className="ml-1 text-sm">({process.env.buildCommit})</span>
          )}
        </span>
        <span className="ml-2 text-sm inline-block">
          Build at {process.env.buildDate}.
        </span>
      </div>
      <h3 className="text-xl font-bold font-title">{t("changelog")}</h3>
      {locale === "ja" ? (
        <ChangeLogJa />
      ) : locale === "en" ? (
        <ChangeLogEn />
      ) : (
        (console.error("unsupported locale"), null)
      )}
    </IndexMain>
  );
}
