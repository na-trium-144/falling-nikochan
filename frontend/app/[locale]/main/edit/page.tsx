import { EditCidInput, SafariLSWarning } from "./cidInput.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { rateLimit } from "@falling-nikochan/chart";
import { IndexMain } from "../main.js";
import Link from "next/link.js";
import { ArrowRightIcon } from "@/common/mdxIcons.js";
import { ExternalLink } from "@/common/extLink.js";
import { ChartList } from "../chartList.js";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.edit");
  return initMetadata(
    params,
    "/main/edit",
    t("title"),
    t("description", { rateLimitMin: rateLimit.newChartFile / 60 })
  );
}

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  const t = await getTranslations(locale, "main.edit");
  return (
    <IndexMain
      title={t("title")}
      tabKey="edit"
      mobileTabKey="edit"
      noBackButtonMobile
      noBackButtonPC
      locale={locale}
    >
      <section className="fn-sect">
        <p className="mb-1">{t("welcome")}</p>
        <p>
          <Link
            href={`/${locale}/main/guide/1`}
            className="fn-link-3 space-x-1"
            prefetch={process.env.PREFETCH as "auto"}
          >
            <span>{t("guide")}</span>
            <ArrowRightIcon />
          </Link>
        </p>
      </section>
      <section className="fn-sect">
        <h3>
          <span className="fn-heading-sect">{t("inputId")}:</span>
          <EditCidInput locale={locale} />
        </h3>
        <p>{t("inputIdDesc")}</p>
      </section>
      <section className="fn-sect">
        <h3>
          <span className="fn-heading-sect">{t("new")}:</span>
          <ExternalLink className="ml-3" href={`/${locale}/edit?cid=new`}>
            {t("newButton")}
          </ExternalLink>
        </h3>
        <p>{t("newDesc", { rateLimitMin: rateLimit.newChartFile / 60 })}</p>
      </section>
      <section className="fn-sect">
        <h3 className="fn-heading-sect">{t("recentEdit")}</h3>
        <SafariLSWarning />
        <ChartList
          type="recentEdit"
          fetchAll
          locale={locale}
          hrefEdit
          newTab
          showLoading
          moreHref={null}
          small
        />
      </section>
    </IndexMain>
  );
}
