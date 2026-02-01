"use client";

import clsx from "clsx/lite";
import Comment from "@icon-park/react/lib/icons/Comment";
import Edit from "@icon-park/react/lib/icons/Edit";
import Home from "@icon-park/react/lib/icons/Home";
import Moon from "@icon-park/react/lib/icons/Moon";
import More from "@icon-park/react/lib/icons/More";
import Search from "@icon-park/react/lib/icons/Search";
import Sun from "@icon-park/react/lib/icons/Sun";
import Translate from "@icon-park/react/lib/icons/Translate";
import { linkStyle1 } from "./linkStyle.js";
import { ThemeSwitcher, useTheme } from "./theme.js";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { lastVisitedOld } from "./version.js";
import { LangSwitcher } from "./langSwitcher.jsx";
import { ChangeLogPopup } from "./changeLog.jsx";
import { LinkWithReview } from "./pwaInstall.jsx";
import { ButtonHighlight } from "./button.jsx";

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
    <footer className="no-mobile w-full py-3 space-y-2">
      {props.nav && (
        <div
          className={clsx(
            "divide-x divide-solid divide-slate-800 dark:divide-stone-300",
            "flex flex-row items-stretch justify-center"
          )}
        >
          {pcTabTitleKeys.map((key, i) => (
            <LinkWithReview
              key={i}
              className={clsx("px-2", linkStyle1)}
              href={`/${props.locale}${tabURLs[key]}`}
            >
              {tm(key + ".title")}
            </LinkWithReview>
          ))}
        </div>
      )}
      <div
        className={clsx("flex flex-row items-baseline justify-center gap-3")}
      >
        <div className="relative">
          <button
            className={clsx("inline-block relative", linkStyle1)}
            onClick={() => {
              setShowChangeLog(!showChangeLog);
            }}
          >
            <span>ver.</span>
            <span className="ml-1 mr-0.5">{process.env.buildVersion}</span>
            <Comment className="inline-block align-middle" />
            {isLastVisitedOld && (
              <span
                className={clsx("absolute w-3 h-3 rounded-full bg-red-500")}
                style={{ top: "-0.1rem", right: "-0.25rem" }}
              />
            )}
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
  className?: string;
  blurBg?: boolean;
  locale: string;
  tabKey: TabKeys;
}
export function MobileFooter(props: MobileProps) {
  const tm = useTranslations("main");
  const themeState = useTheme();
  const [isLastVisitedOld, setIsLastVisitedOld] = useState<boolean>(false);

  useEffect(() => {
    setIsLastVisitedOld(lastVisitedOld());
  }, []);

  const iconFill = themeState.isDark
    ? ["#d6d3d1" /*stone-300*/, "#a6a09b" /*stone-400*/]
    : ["#1d293d" /*slate-800*/, "#62748e" /*slate-500*/];

  return (
    <footer
      className={clsx(
        "fn-mobile-footer no-pc",
        props.blurBg && "fn-mf-blur",
        props.className
      )}
    >
      {mobileTabTitleKeys.map((key, i) => (
        <LinkWithReview
          key={i}
          className={clsx(
            "fn-mf-item",
            props.tabKey !== "top" && "rounded-t-none",
            props.tabKey === key && props.tabKey !== "top"
              ? "fn-flat-button fn-plain fn-selected"
              : "fn-flat-button fn-sky"
          )}
          href={`/${props.locale}${tabURLs[key]}`}
        >
          <span
            className={clsx(
              "fn-glass-1",
              props.tabKey !== "top" && "border-t-0"
            )}
          />
          <span
            className={clsx(
              "fn-glass-2",
              props.tabKey !== "top" && "border-t-0"
            )}
          />
          <ButtonHighlight />
          {i === 0 ? (
            <Home
              theme={props.tabKey === key ? "two-tone" : "outline"}
              fill={props.tabKey === key ? iconFill : iconFill[0]}
            />
          ) : i === 1 ? (
            <Search
              theme={props.tabKey === key ? "two-tone" : "outline"}
              fill={props.tabKey === key ? iconFill : iconFill[0]}
            />
          ) : i === 2 ? (
            <Edit
              theme={props.tabKey === key ? "two-tone" : "outline"}
              fill={props.tabKey === key ? iconFill : iconFill[0]}
            />
          ) : (
            <div className="relative">
              <More
                theme={props.tabKey === key ? "two-tone" : "outline"}
                fill={props.tabKey === key ? iconFill : iconFill[0]}
              />
              {isLastVisitedOld && (
                <span
                  className={clsx("absolute w-3 h-3 rounded-full bg-red-500")}
                  style={{ top: "-0.1rem", right: "-0.5rem" }}
                />
              )}
            </div>
          )}
          <span className="text-xs">{tm(key + ".titleShort")}</span>
        </LinkWithReview>
      ))}
    </footer>
  );
}
