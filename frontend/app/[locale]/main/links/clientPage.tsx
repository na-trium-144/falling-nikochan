"use client";
import { useTranslations } from "next-intl";
import clsx from "clsx/lite";
import { IndexMain } from "../main";
import Link from "next/link";
import { MenuLangSwitcher } from "@/common/langSwitcher";
import { MenuThemeSwitcher } from "@/common/theme";
import { PWAInstallDesc } from "@/common/pwaInstall";
import { useEffect, useState } from "react";
import { lastVisitedOld } from "@/common/version";

export default function LinksPage({ locale }: { locale: string }) {
  const t = useTranslations("main.links");

  const [isLastVisitedOld, setIsLastVisitedOld] = useState<boolean>(false);
  useEffect(() => setIsLastVisitedOld(lastVisitedOld()), []);

  return (
    <IndexMain
      title={t("titleShort")}
      tabKey="links"
      mobileTabKey="links"
      noBackButtonMobile
      locale={locale}
    >
      <section className="fn-sect no-pc">
        <h3 className="fn-heading-sect">{t("settings")}</h3>
        <div className="space-y-2">
          <MenuLangSwitcher locale={locale} />
          <MenuThemeSwitcher />
          <PWAInstallDesc block />
        </div>
      </section>
      <PWAInstallDesc block className="fn-sect no-mobile" />
      <section className="fn-sect">
        <h3 className="fn-heading-sect">{t("about")}</h3>
        <div className="space-y-1">
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
          <p className="no-pc">
            <Link
              className={clsx("fn-link-3")}
              href={`/${locale}/main/policies`}
              prefetch={process.env.PREFETCH as "auto"}
            >
              {t("policies")}
            </Link>
          </p>
        </div>
      </section>
      <section className="fn-sect">
        <h3 className="fn-heading-sect">{t("title")}</h3>
      </section>
    </IndexMain>
  );
}
