"use client";

import Comment from "@icon-park/react/lib/icons/Comment";
import Edit from "@icon-park/react/lib/icons/Edit";
import Home from "@icon-park/react/lib/icons/Home";
import Moon from "@icon-park/react/lib/icons/Moon";
import More from "@icon-park/react/lib/icons/More";
import Search from "@icon-park/react/lib/icons/Search";
import Sun from "@icon-park/react/lib/icons/Sun";
import Translate from "@icon-park/react/lib/icons/Translate";
import Link from "next/link";
import { linkStyle1 } from "./linkStyle.js";
import { ThemeSwitcher, useTheme } from "./theme.js";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { lastVisitedOld } from "./version.js";
import { LangSwitcher } from "./langSwitcher.jsx";
import { ChangeLogPopup } from "./changeLog.jsx";

export type TabKeys = "top" | "play" | "edit" | "policies" | "links" | null;
export const pcTabTitleKeys = ["play", "edit", "policies", "links"] as const;
export const mobileTabTitleKeys = ["top", "play", "edit", "links"] as const;
export const tabURLs = {
  play: "/main/play",
  edit: "/main/edit",
  policies: "/main/policies",
  links: "/main/links",
  top: "/",
} as const;

interface Props {
  nav?: boolean; // trueで表示
  locale: string;
}
export function PCFooter(props: Props) {
  const themeState = useTheme();
  const tm = useTranslations("main");
  const t = useTranslations("footer");
  const [isLastVisitedOld, setIsLastVisitedOld] = useState<boolean>(false);
  useEffect(() => setIsLastVisitedOld(lastVisitedOld()), []);
  const [showChangeLog, setShowChangeLog] = useState<boolean>(false);

  return (
    <footer className="py-3 hidden main-wide:block relative text-center ">
      {props.nav && (
        <div
          className={
            "text-center mb-2 divide-solid divide-slate-800 dark:divide-stone-300 " +
            "flex items-stretch w-max mx-auto " +
            "divide-x flex-row "
          }
        >
          {pcTabTitleKeys.map((key, i) => (
            <Link
              key={i}
              className={"px-2 " + linkStyle1}
              href={`/${props.locale}${tabURLs[key]}`}
              prefetch={!process.env.NO_PREFETCH}
            >
              {tm(key + ".title")}
            </Link>
          ))}
        </div>
      )}
      <div className={"flex-row items-baseline space-x-3"}>
        <div className="inline-block relative">
          <button
            className={"inline-block relative " + linkStyle1}
            onClick={() => {
              setShowChangeLog(!showChangeLog);
            }}
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
          </button>
          <ChangeLogPopup
            locale={props.locale}
            open={showChangeLog}
            onClose={() => setShowChangeLog(false)}
          />
        </div>
        <LangSwitcher locale={props.locale}>
          <Translate className="absolute bottom-1 left-0 " />
          <span className="ml-5 ">Language</span>
        </LangSwitcher>
        <ThemeSwitcher>
          {themeState.isDark ? (
            <Moon className="absolute bottom-1 left-0 " />
          ) : (
            <Sun className="absolute bottom-1 left-0 " />
          )}
          <span className="ml-5 ">{t("theme")}</span>
        </ThemeSwitcher>
      </div>
    </footer>
  );
}
interface MobileProps {
  locale: string;
  tabKey: TabKeys;
}
export function MobileFooter(props: MobileProps) {
  const tm = useTranslations("main");
  const themeState = useTheme();
  const iconFill = themeState.isDark
    ? ["#d6d3d1" /*stone-300*/, "#a6a09b" /*stone-400*/]
    : ["#1d293d" /*slate-800*/, "#62748e" /*slate-500*/];
  return (
    <footer
      className={
        "pt-3 pb-1 z-10 w-full " +
        "main-wide:h-0 main-wide:p-0! " +
        "flex flex-row items-center justify-stretch relative"
      }
    >
      {mobileTabTitleKeys.map((key, i) => (
        <Link
          key={i}
          className={
            "w-full text-xl space-y-1 flex flex-col items-center main-wide:hidden " +
            (props.tabKey === key ? "" : "text-slate-500 dark:text-stone-400 ")
          }
          href={`/${props.locale}${tabURLs[key]}`}
          prefetch={!process.env.NO_PREFETCH}
        >
          {i === 0 ? (
            <Home
              theme={props.tabKey === key ? "two-tone" : "outline"}
              fill={props.tabKey === key ? iconFill : iconFill[1]}
            />
          ) : i === 1 ? (
            <Search
              theme={props.tabKey === key ? "two-tone" : "outline"}
              fill={props.tabKey === key ? iconFill : iconFill[1]}
            />
          ) : i === 2 ? (
            <Edit
              theme={props.tabKey === key ? "two-tone" : "outline"}
              fill={props.tabKey === key ? iconFill : iconFill[1]}
            />
          ) : (
            <More
              theme={props.tabKey === key ? "two-tone" : "outline"}
              fill={props.tabKey === key ? iconFill : iconFill[1]}
            />
          )}
          <span className="text-sm ">{tm(key + ".titleShort")}</span>
        </Link>
      ))}
    </footer>
  );
}
