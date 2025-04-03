"use client";
import { useTranslations } from "next-intl";
import { IndexMain } from "../main";
import { ExternalLink } from "@/common/extLink";
import {
  DownOne,
  Github,
  Moon,
  Sun,
  Translate,
  Youtube,
} from "@icon-park/react";
import { linkStyle1, linkStyle3 } from "@/common/linkStyle";
import Link from "next/link";
import { langNames, LangSwitcher } from "@/common/langSwitcher";
import { ThemeSwitcher, useTheme } from "@/common/theme";
import {
  PWAInstallDesc,
  usePWAInstall,
  useStandaloneDetector,
} from "@/common/pwaInstall";
import Button from "@/common/button";

export default function LinksPage({ locale }: { locale: string }) {
  const t = useTranslations("main.links");
  const tp = useTranslations("main.pwa");
  const themeState = useTheme();
  const isStandalone = useStandaloneDetector();
  const pwa = usePWAInstall();
  return (
    <IndexMain
      title={t("titleShort")}
      tabKey="links"
      mobileTabKey="links"
      noBackButton
      locale={locale}
    >
      <div className="mb-3 main-wide:hidden">
        <h3 className="mb-2 text-xl font-bold font-title">{t("settings")}</h3>
        <div className="ml-2 space-y-2">
          <p>
            <Translate className="inline-block align-middle" />
            <span className="ml-1">Language:</span>
            <LangSwitcher locale={locale}>
              <span
                className={
                  "inline-block align-top mx-1 px-1 " +
                  linkStyle1 +
                  "border-0 border-b border-slate-400 dark:border-stone-600 bg-transparent appearance-none rounded-none "
                }
              >
                <span className="flex flex-row items-center ">
                  <span className="flex-1 text-center ">
                    {langNames[locale]}
                  </span>
                  <DownOne className="w-max h-max" theme="filled" />
                </span>
                {Object.values(langNames).map((l) => (
                  // 最大幅を取得するため
                  <p key={l} className="h-0 overflow-hidden pr-6 ">
                    {l}
                  </p>
                ))}{" "}
              </span>
            </LangSwitcher>
          </p>
          <p>
            {themeState.isDark ? (
              <Moon className="inline-block align-middle " />
            ) : (
              <Sun className="inline-block align-middle " />
            )}
            <span className="ml-1 ">{t("theme")}:</span>
            <ThemeSwitcher>
              <span
                className={
                  "inline-block align-top mx-1 px-1 " +
                  linkStyle1 +
                  "border-0 border-b border-slate-400 dark:border-stone-600 bg-transparent appearance-none rounded-none "
                }
              >
                <span className="flex flex-row items-center ">
                  <span className="flex-1 text-center">
                    {themeState.theme === "dark"
                      ? t("dark")
                      : themeState.theme === "light"
                        ? t("light")
                        : t("default")}
                  </span>
                  <DownOne className="w-max h-max " theme="filled" />
                </span>
                <p className="h-0 overflow-hidden pr-6 ">{t("dark")}</p>
                <p className="h-0 overflow-hidden pr-6 ">{t("light")}</p>
                <p className="h-0 overflow-hidden pr-6 ">{t("default")}</p>
              </span>
            </ThemeSwitcher>
          </p>
          {isStandalone === false && (
            <div>
              <PWAInstallDesc />
            </div>
          )}
        </div>
      </div>
      {isStandalone === false && (
        <div className="mb-3 hidden main-wide:block">
          <PWAInstallDesc />
        </div>
      )}
      <div className="mb-3 main-wide:hidden ">
        <h3 className="mb-2 text-xl font-bold font-title">{t("about")}</h3>
        <div className="ml-2 space-y-1">
          <p>
            <span>{t("version")}:</span>
            <span className="inline-block">
              <span className="ml-2">ver.</span>
              <span className="ml-1">{process.env.buildVersion}</span>
            </span>
            <Link
              className={linkStyle3 + "ml-2 inline-block "}
              href={`/${locale}/main/version`}
              prefetch={!process.env.NO_PREFETCH}
            >
              {t("changelog")}
            </Link>
          </p>
          <p>
            <Link
              className={linkStyle3}
              href={`/${locale}/main/policies`}
              prefetch={!process.env.NO_PREFETCH}
            >
              {t("policies")}
            </Link>
          </p>
        </div>
      </div>
      <div className="mb-3">
        <h3 className="mb-2 text-xl font-bold font-title">{t("title")}</h3>
        <ul className="list-disc ml-6 space-y-1 ">
          <li>
            <ExternalLink href="https://forms.gle/3PVFRA7nUtXSHb8TA">
              {t("contactForm")}
            </ExternalLink>
          </li>
          <li>
            <Youtube
              className="inline-block align-middle mr-1"
              theme="filled"
            />
            <ExternalLink href="https://www.youtube.com/@nikochan144">
              <span className="hidden main-wide:inline">
                {t("officialChannel")}
              </span>
              <span className="main-wide:hidden">
                {t("officialChannelShort")}
              </span>
            </ExternalLink>
          </li>
          <li>
            <Github className="inline-block align-middle mr-1" />
            <span className="mr-1">GitHub:</span>
            <ExternalLink href="https://github.com/na-trium-144/falling-nikochan">
              <span className="hidden main-wide:inline">na-trium-144/</span>
              <span>falling-nikochan</span>
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://utcode.net">ut.code();</ExternalLink>
          </li>
        </ul>
      </div>
    </IndexMain>
  );
}
