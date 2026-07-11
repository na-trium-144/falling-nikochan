"use client";
import { useTranslations } from "next-intl";
import clsx from "clsx/lite";
import { IndexMain } from "../main";
import Link from "next/link";
import { MenuLangSwitcher } from "@/common/langSwitcher";
import { MenuThemeSwitcher } from "@/common/theme";
import { PWAInstallDesc } from "@/common/pwaInstall";
import { useEffect, useRef, useState } from "react";
import { lastVisitedOld } from "@/common/version";
import {
  APIDocsLink,
  ContactFormLink,
  DeferredEMail,
  DevPageLink,
  GitHubLink,
  XLink,
} from "@/clientPage";

export default function LinksPage({ locale }: { locale: string }) {
  const t = useTranslations("main.links");

  const [isLastVisitedOld, setIsLastVisitedOld] = useState<boolean>(false);
  useEffect(() => setIsLastVisitedOld(lastVisitedOld()), []);

  const clickCount = useRef<number>(0);
  const prevClickCount = useRef<DOMHighResTimeStamp>(0);
  const [showDev, setShowDev] = useState(false);
  const clickCounter = () => {
    if (performance.now() - prevClickCount.current > 1000) {
      clickCount.current = 0;
    }
    prevClickCount.current = performance.now();
    if (++clickCount.current >= 7) {
      setShowDev(true);
    }
    console.log(clickCount.current);
  };

  return (
    <IndexMain
      title={t("titleShort")}
      tabKey="links"
      mobileTabKey="links"
      noBackButtonMobile
      locale={locale}
    >
      <section className="fn-sect">
        <h3 className="fn-heading-sect">{t("settings")}</h3>
        <div className="space-y-2">
          <MenuLangSwitcher locale={locale} />
          <MenuThemeSwitcher />
          <PWAInstallDesc block />
        </div>
      </section>
      <section className="fn-sect">
        <h3 className="fn-heading-sect">{t("contactLinks")}</h3>
        <ul className="list-disc ml-6 space-y-1 text-left">
          <li>
            <ContactFormLink />
          </li>
          <li>
            <XLink />
          </li>
          <li>
            <GitHubLink />
          </li>
          <li>
            <DeferredEMail />
          </li>
        </ul>
      </section>
      <section className="fn-sect" onClick={clickCounter}>
        <h3 className="fn-heading-sect">{t("about")}</h3>
        <div className="space-y-1 mb-2">
          <p className="text-left">
            <span>{t("version")}:</span>
            <span className="inline-block">
              <span className="ml-2">ver.</span>
              <span className="ml-1">{process.env.buildVersion}</span>
            </span>
            <Link
              className={clsx("fn-link-3", "ml-2 inline-block relative")}
              href={`/${locale}/main/version`}
              prefetch={process.env.PREFETCH as "auto"}
            >
              {t("changelog")}
              <span
                className={clsx(
                  "absolute w-3 h-3 rounded-full bg-red-500",
                  isLastVisitedOld ? "inline-block" : "hidden"
                )}
                style={{ top: "-0.1rem", right: "-0.35rem" }}
              />
            </Link>
          </p>
          <p>
            {t("supportedBrowsers", {
              browserslist: process.env.browserslist!,
            })}
          </p>
        </div>
        {showDev && (
          <ul className="list-disc ml-6 space-y-1 text-left">
            <li>
              <APIDocsLink />
            </li>
            <li>
              <DevPageLink locale={locale} />
            </li>
          </ul>
        )}
      </section>
    </IndexMain>
  );
}
