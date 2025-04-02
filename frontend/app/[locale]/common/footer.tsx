"use client";

import {
  Comment,
  Edit,
  Home,
  Moon,
  More,
  Search,
  Sun,
  Translate,
} from "@icon-park/react";
import Link from "next/link";
import { linkStyle1 } from "./linkStyle.js";
import { ThemeSwitcher, useTheme } from "./theme.js";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { lastVisitedOld } from "./version.js";
import { usePWAInstall } from "./pwaInstall.js";
import { Box } from "./box.js";
import { SlimeSVG } from "./slime.js";
import { LangSwitcher } from "./langSwitcher.jsx";

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
        <Link
          className={"inline-block relative group " + linkStyle1}
          href={`/${props.locale}/main/version`}
          prefetch={!process.env.NO_PREFETCH}
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
      <PWAUpdateNotification />
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

export function PWAUpdateNotification() {
  const t = useTranslations("main");
  const pwa = usePWAInstall();
  useEffect(() => pwa.setEnableWorkerUpdate(true), [pwa.setEnableWorkerUpdate]);
  return (
    <Box
      className={
        "absolute bottom-full inset-x-0 p-2 w-max max-w-full mx-auto shadow-lg " +
        "transition-all duration-200 origin-bottom " +
        (pwa.workerUpdate !== null
          ? "ease-in scale-100 opacity-100 "
          : "ease-out scale-0 opacity-0 ")
      }
    >
      {pwa.workerUpdate === "updating" ? (
        <>
          <SlimeSVG />
          {t("updating")}
        </>
      ) : pwa.workerUpdate === "done" ? (
        t("updateDone")
      ) : pwa.workerUpdate === "failed" ? (
        t("updateFailed")
      ) : null}
    </Box>
  );
}
