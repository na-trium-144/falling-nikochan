"use client";

import { Comment, Github, Translate } from "@icon-park/react";
import Link from "next/link";
import { linkStyle1 } from "./linkStyle.js";
import { ExternalLink } from "./extLink.js";
import { ThemeSwitcher, useTheme } from "./theme.js";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation.js";
import { useEffect, useState } from "react";
import { lastVisitedOld } from "./version.js";

export const tabTitleKeys = [
  "about",
  "play",
  "edit",
  "policies",
  // ↓ hidden page (トップページにリンクが表示されない)
  "version",
];
export const tabURLs = [
  "/main/about/1",
  "/main/play",
  "/main/edit",
  "/main/policies",
];

interface Props {
  // trueで表示、または "main-wide:hidden" などのようにクラス指定
  nav?: boolean | string;
  locale: string;
}
export default function Footer(props: Props) {
  const themeContext = useTheme();
  const tm = useTranslations("main");
  // const t = useTranslations("footer");
  const tabTitles = (i: number) => tm(tabTitleKeys[i] + ".title");
  const [isLastVisitedOld, setIsLastVisitedOld] = useState<boolean>(false);
  useEffect(() => setIsLastVisitedOld(lastVisitedOld()), []);

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
        <div
          className={
            // "flex flex-col items-center justify-center " +
            /*footer-wide3:*/ "flex-row items-baseline space-x-3"
          }
        >
          <Link
            className={"inline-block relative group " + linkStyle1}
            href={`/${props.locale}/main/version`}
            prefetch={false}
          >
            <span>ver.</span>
            <span className="ml-1 mr-0.5">{process.env.buildVersion}</span>
            <Comment className="inline-block translate-y-0.5 " />
            <span
              className={
                "absolute w-3 h-3 rounded-full bg-red-500 " +
                (isLastVisitedOld ? "inline-block " : "hidden ")
              }
              style={{ top: "-0.1rem", right: "-0.25rem" }}
            />
          </Link>
          {/*<span className="space-x-3">*/}
          <LangSwitcher locale={props.locale} />
          <ThemeSwitcher {...themeContext} />
          {/*</span>*/}
        </div>
      </div>
    </footer>
  );
}

const langNames: { [key: string]: string } = {
  ja: "日本語",
  en: "English",
};
interface LangProps {
  locale: string;
}
export function LangSwitcher(props: LangProps) {
  const router = useRouter();
  return (
    <span className={"inline-block relative " + linkStyle1}>
      <select
        className="absolute text-center inset-0 opacity-0 z-10 cursor-pointer appearance-none "
        value={props.locale}
        onChange={(e) => {
          document.cookie = `language=${e.target.value};path=/;max-age=31536000`;
          if (window.location.pathname.startsWith(`/${props.locale}`)) {
            router.replace(
              window.location.pathname.replace(
                `/${props.locale}`,
                `/${e.target.value}`
              ),
              { scroll: false }
            );
          } else {
            // /share/cid など
            router.refresh();
          }
        }}
      >
        {Object.keys(langNames).map((lang) => (
          <option key={lang} value={lang}>
            {langNames[lang]}
          </option>
        ))}
      </select>
      <Translate className="absolute bottom-1 left-0 " />
      <span className="ml-5 ">Language</span>
    </span>
  );
}
