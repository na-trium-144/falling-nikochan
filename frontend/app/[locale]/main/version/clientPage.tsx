"use client";

import { IndexMain } from "../main.js";
import { useTranslations } from "next-intl";
import { updateLastVisited } from "@/common/version.js";
import { ReactNode, useEffect, useRef } from "react";
import { useRouter } from "next/navigation.js";

export default function ChangelogPage(props: {
  locale: string;
  changeLogAll: ReactNode;
}) {
  const t = useTranslations("main.version");
  useEffect(() => updateLastVisited(), []);
  const versionClickCount = useRef<number>(0);
  const prevVersionClickCount = useRef<DOMHighResTimeStamp>(0);
  const router = useRouter();

  const versionClick = () => {
    if (performance.now() - prevVersionClickCount.current > 1000) {
      versionClickCount.current = 0;
    }
    prevVersionClickCount.current = performance.now();
    if (++versionClickCount.current >= 7) {
      router.push(`/${props.locale}/dev`);
    }
    console.log(versionClickCount.current);
  };

  return (
    <IndexMain
      title={t("title")}
      tabKey={null}
      mobileTabKey="links"
      locale={props.locale}
    >
      <section className="fn-sect" onClick={versionClick}>
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
