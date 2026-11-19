import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import { IndexMain } from "../main.js";
import { MenuLangSwitcher } from "@/common/langSwitcher.js";
import { MenuThemeSwitcher } from "@/common/theme.js";
import { PWAInstallDesc } from "@/common/pwaInstall.js";
import {
  APIDocsLink,
  ContactFormLink,
  DeferredEMail,
  DevPageLink,
  GitHubLink,
  XLink,
} from "@/common/contactLinks.js";
import { OpenDevCounter } from "@/common/counter.js";
import { LastVisitedIndicator } from "@/common/version.js";
import Link from "next/link.js";
import clsx from "clsx/lite";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.links");
  return initMetadata(params, "/main/links", t("title"), t("description"));
}

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  const t = await getTranslations(locale, "main.links");
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
      <OpenDevCounter as="section" className="fn-sect">
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
              <LastVisitedIndicator
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
        <ul className="list-disc ml-6 space-y-1 text-left">
          <li>
            <APIDocsLink />
          </li>
          <li className="fn-counter-hidden">
            <DevPageLink locale={locale} />
          </li>
        </ul>
      </OpenDevCounter>
    </IndexMain>
  );
}
