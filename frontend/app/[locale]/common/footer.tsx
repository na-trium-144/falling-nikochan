"use client";

import { Comment, Edit, Home, More, Search, Translate } from "@icon-park/react";
import Link from "next/link";
import { linkStyle1 } from "./linkStyle.js";
import { ThemeSwitcher, useTheme } from "./theme.js";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation.js";
import { useEffect, useState } from "react";
import { lastVisitedOld } from "./version.js";
import { PWAStates } from "./pwaInstall.js";
import { Box } from "./box.js";
import { SlimeSVG } from "./slime.js";

export type tabKeys = "top" | "play" | "edit" | "policies" | "links" | null;
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
  pwa: PWAStates;
}
export function PCFooter(props: Props) {
  const themeContext = useTheme();
  const tm = useTranslations("main");
  // const t = useTranslations("footer");
  const [isLastVisitedOld, setIsLastVisitedOld] = useState<boolean>(false);
  useEffect(() => setIsLastVisitedOld(lastVisitedOld()), []);

  return (
    <footer className="py-3 z-50 hidden main-wide:block relative ">
      <PWAUpdateNotification pwa={props.pwa} />
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
        <LangSwitcher locale={props.locale} />
        <ThemeSwitcher {...themeContext} />
      </div>
    </footer>
  );
}
export function MobileFooter(props: Props) {
  const tm = useTranslations("main");
  return (
    <footer className="pt-3 pb-1 z-50 w-full main-wide:hidden flex flex-row items-center justify-stretch relative">
      <PWAUpdateNotification pwa={props.pwa} />
      {mobileTabTitleKeys.map((key, i) => (
        <Link
          key={i}
          className={
            "w-full text-lg space-y-1 flex flex-col items-center " + linkStyle1
          }
          href={`/${props.locale}${tabURLs[key]}`}
          prefetch={!process.env.NO_PREFETCH}
        >
          {i === 0 ? (
            <Home />
          ) : i === 1 ? (
            <Search />
          ) : i === 2 ? (
            <Edit />
          ) : (
            <More />
          )}
          <span className="text-xs ">{tm(key + ".titleShort")}</span>
        </Link>
      ))}
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
                `/${e.target.value}`,
              ),
              { scroll: false },
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

export function PWAUpdateNotification(props: { pwa: PWAStates }) {
  const t = useTranslations("main");
  return (
    <Box
      className={
        "absolute bottom-full inset-x-0 p-2 w-max max-w-full mx-auto shadow-lg " +
        "transition-all duration-200 origin-bottom " +
        (props.pwa.workerUpdate !== null
          ? "ease-in scale-100 opacity-100 "
          : "ease-out scale-0 opacity-0 ")
      }
    >
      {props.pwa.workerUpdate === "updating" ? (
        <>
          <SlimeSVG />
          {t("updating")}
        </>
      ) : props.pwa.workerUpdate === "done" ? (
        t("updateDone")
      ) : props.pwa.workerUpdate === "failed" ? (
        t("updateFailed")
      ) : null}
    </Box>
  );
}
