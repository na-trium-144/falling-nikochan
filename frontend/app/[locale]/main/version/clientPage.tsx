"use client";

import { IndexMain } from "../main.js";
import { useTranslations } from "next-intl";
import { updateLastVisited } from "@/common/version.js";
import { ReactNode, useEffect } from "react";

export default function ChangelogPage(props: {
  locale: string;
  changeLogAll: ReactNode;
}) {
  const t = useTranslations("main.version");
  useEffect(() => updateLastVisited(), []);

  return (
    <IndexMain
      title={t("title")}
      tabKey={null}
      mobileTabKey="links"
      locale={props.locale}
    >
      <section className="fn-sect">
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
      </section>
      <section className="fn-sect fn-mdx-changelog">
        <h3 className="fn-heading-sect">{t("changelog")}</h3>
        {props.changeLogAll}
      </section>
    </IndexMain>
  );
}
