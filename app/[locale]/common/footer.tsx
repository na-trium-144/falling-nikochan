"use client";

import { tabTitleKeys, tabURLs } from "@/main/const.js";
import { Github } from "@icon-park/react";
import Link from "next/link";
import { linkStyle1 } from "./linkStyle.js";
import { ExternalLink } from "./extLink.js";
import { ThemeSwitcher, useTheme } from "./theme.js";
import { useTranslations } from "next-intl";

interface Props {
  // trueで表示、または "main-wide:hidden" などのようにクラス指定
  nav?: boolean | string;
  locale: string;
}
export default function Footer(props: Props) {
  const themeContext = useTheme();
  const tm = useTranslations("main");
  const t = useTranslations("footer");
  const tabTitles = (i: number) => tm(tabTitleKeys[i] + ".title");

  return (
    <footer className="pb-3">
      {props.nav && (
        <div
          className={
            "text-center mb-3 divide-solid divide-slate-800 dark:divide-stone-300 " +
            "flex flex-col space-y-1 items-stretch w-max mx-auto " +
            "footer-wide:divide-x footer-wide:space-y-0 footer-wide:flex-row " +
            (typeof props.nav === "string" ? props.nav : "")
          }
        >
          {tabURLs.map((tabURL, i) => (
            <Link
              key={i}
              className={"px-2 " + linkStyle1}
              href={`/${props.locale}${tabURL}`}
              prefetch={false}
            >
              {tabTitles(i)}
            </Link>
          ))}
        </div>
      )}
      <div
        className={
          "flex flex-col items-center justify-center " +
          "footer-wide2:flex-row footer-wide2:items-baseline footer-wide2:space-x-3"
        }
      >
        <ExternalLink
          noColor
          href="https://github.com/na-trium-144/falling-nikochan"
          icon={<Github className="absolute bottom-1 left-0" />}
        >
          na-trium-144/falling-nikochan
        </ExternalLink>
        <span className="space-x-3">
          <Link
            className={"inline-block " + linkStyle1}
            href={`/${props.locale}/main/version`}
            prefetch={false}
          >
            <span>ver.</span>
            <span className="mx-1">{process.env.buildVersion}</span>
            <span className="text-xs">({t("history")})</span>
          </Link>
          <ThemeSwitcher {...themeContext} />
        </span>
      </div>
    </footer>
  );
}
