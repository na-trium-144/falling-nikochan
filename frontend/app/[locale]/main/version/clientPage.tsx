"use client";

import { IndexMain } from "../main.js";
import { useTranslations } from "next-intl";
import { updateLastVisited } from "@/common/version.js";
import { ReactNode, useEffect } from "react";

export default function ChangelogPage(props: {
  locale: string;
  changeLog: ReactNode;
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
      <h3 className="mb-2 text-xl font-bold font-title">{t("about")}</h3>
      <p className="mb-2">
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
      </p>
      <p className="mb-3 text-justify">
        {t("supportedBrowsers", { browserslist: process.env.browserslist! })}
      </p>
      <h3 className="text-xl font-bold font-title">{t("changelog")}</h3>
      {props.changeLog}
    </IndexMain>
  );
}
