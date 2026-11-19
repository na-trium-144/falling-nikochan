import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import { importChangeLogMDX } from "@falling-nikochan/i18n/mdx";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { MDXRenderAll } from "@/common/mdxHiddenPart.jsx";
import { IndexMain } from "../main.js";
import { UpdateLastVisited } from "@/common/version.js";
import { OpenDevCounter } from "@/common/counter.js";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.version");
  return initMetadata(params, "/main/version", t("title"), t("description"));
}
export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  const ChangeLog = await importChangeLogMDX(locale);
  const t = await getTranslations(locale, "main.version");
  return (
    <IndexMain
      title={t("title")}
      tabKey={null}
      mobileTabKey="links"
      locale={locale}
    >
      <UpdateLastVisited />
      <OpenDevCounter
        as="section"
        className="fn-sect"
        pushHref={`/${locale}/dev`}
      >
        <h3 className="fn-heading-sect">{t("about")}</h3>
        <p className="mb-2 text-left flex flex-wrap items-baseline">
          <span>Falling Nikochan</span>
          <span className="ml-2">
            <span>ver.</span>
            <span className="ml-1">{process.env.buildVersion}</span>
            {process.env.buildCommit && (
              <span className="ml-1 text-sm">({process.env.buildCommit})</span>
            )}
          </span>
          <span className="ml-2 text-sm">
            Build at {process.env.buildDate}.
          </span>
        </p>
        <p className="">
          {t("supportedBrowsers", { browserslist: process.env.browserslist! })}
        </p>
      </OpenDevCounter>
      <section className="fn-sect fn-mdx-changelog">
        <h3 className="fn-heading-sect">{t("changelog")}</h3>
        <MDXRenderAll>
          <ChangeLog />
        </MDXRenderAll>
      </section>
    </IndexMain>
  );
}
