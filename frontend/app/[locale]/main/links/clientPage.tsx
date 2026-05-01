"use client";
import { useTranslations } from "next-intl";
import clsx from "clsx/lite";
import { IndexMain } from "../main";
import { ExternalLink } from "@/common/extLink";
import DownOne from "@icon-park/react/lib/icons/DownOne";
import Github from "@icon-park/react/lib/icons/Github";
import Moon from "@icon-park/react/lib/icons/Moon";
import Sun from "@icon-park/react/lib/icons/Sun";
import Translate from "@icon-park/react/lib/icons/Translate";
import Youtube from "@icon-park/react/lib/icons/Youtube";
import Link from "next/link";
import {
  langNames,
  LangSwitcher,
  MenuLangSwitcher,
} from "@/common/langSwitcher";
import { MenuThemeSwitcher, ThemeSwitcher, useTheme } from "@/common/theme";
import { PWAInstallDesc } from "@/common/pwaInstall";
import { useEffect, useState } from "react";
import Mail from "@icon-park/react/lib/icons/Mail";
import { FestivalLink, useFestival } from "@/common/festival";
import Code from "@icon-park/react/lib/icons/Code";
import FormOne from "@icon-park/react/lib/icons/FormOne";
import { lastVisitedOld } from "@/common/version";
import { XLogo } from "@/common/x";

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
      noBackButtonPC
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
