"use client";

import clsx from "clsx/lite";
import { PlayOption } from "./playOption.js";
import {
  ChartBrief,
  RecordGetSummary,
  ResultParams,
} from "@falling-nikochan/chart";
import { useEffect, useRef, useState } from "react";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube.js";
import { linkStyle1 } from "@/common/linkStyle.js";
import { isSample } from "@falling-nikochan/chart";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft.js";
import International from "@icon-park/react/lib/icons/International.js";
import { useTranslations } from "next-intl";
import { useShareLink } from "@/common/shareLinkAndImage.js";
import { SharedResultBox } from "./sharedResult.js";
import { pagerButtonClass } from "@/common/pager.jsx";
import { useColorThief } from "@/common/colorThief.js";
import { defaultThemeStyle } from "@/common/theme.jsx";
import { ExternalLink } from "@/common/extLink.jsx";

interface Props {
  cid: string | undefined;
  brief: ChartBrief | null;
  record: RecordGetSummary[] | null;
  sharedResult?: ResultParams | null;
  locale: string;
  backButton?: () => void;
  forceShowCId?: boolean; // 通常はPCでは表示、モバイルでは非表示だが、trueの場合モバイルでも表示する
}
export function ShareBox(props: Props) {
  const t = useTranslations("share");
  const { cid, brief, sharedResult, locale } = props;

  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    if (brief) {
      setUpdatedAt(new Date(brief.updatedAt).toLocaleDateString());
    }
  }, [brief]);

  const ytPlayer = useRef<YouTubePlayer>(undefined);
  const shareLink = useShareLink(cid, brief, locale);
  const colorThief = useColorThief();

  interface YtMeta {
    title: string;
    channelTitle: string;
  }
  const [ytMeta, setYtMeta] = useState<YtMeta | null>(null);
  useEffect(() => {
    if (cid) {
      fetch(
        process.env.BACKEND_PREFIX + `/api/ytMeta/${cid}?lang=${locale}`
      ).then(async (res) => {
        if (res.ok) {
          setYtMeta(await res.json());
        } else {
          setYtMeta(null);
        }
      });
    }
  }, [cid, locale]);

  return (
    <>
      <div
        className={clsx(
          "flex flex-col",
          "main-wide:flex-row-reverse main-wide:items-end"
        )}
      >
        <div
          className={clsx(
            "w-full shrink-0 main-wide:basis-1/3 share-yt-wide:w-80",
            "p-2 rounded-lg",
            ytMeta &&
              colorThief.ready &&
              "rounded-br-none main-wide:rounded-br-lg main-wide:rounded-bl-none",
            "relative",
            colorThief.boxStyle
          )}
          style={{ color: colorThief.currentColor }}
        >
          <span className={colorThief.boxBorderStyle1} />
          <span className={colorThief.boxBorderStyle2} />
          <FlexYouTube
            fixedSide="width"
            className="w-full"
            id={brief?.ytId}
            control={true}
            ytPlayer={ytPlayer}
          />
          {brief?.ytId && (
            <img
              ref={colorThief.imgRef}
              className="hidden"
              src={`https://i.ytimg.com/vi/${brief?.ytId}/mqdefault.jpg`}
              crossOrigin="anonymous"
            />
          )}
        </div>
        <div className="main-wide:flex-1 main-wide:self-stretch min-w-0 flex flex-col items-start">
          <div className="w-full h-full flex flex-col main-wide:flex-col-reverse items-start overflow-hidden">
            <div
              className={clsx(
                "self-end w-max max-w-full pl-3",
                "mb-2 main-wide:mb-0 main-wide:mt-2",
                "text-right leading-0"
              )}
            >
              <div
                className={clsx(
                  "px-2 pb-1 main-wide:pt-1 w-max max-w-full",
                  "rounded-b-lg main-wide:rounded-l-lg main-wide:rounded-r-none",
                  "relative",
                  colorThief.boxStyle,
                  !(ytMeta && colorThief.ready) &&
                    "-translate-y-full main-wide:translate-y-0 main-wide:translate-x-full",
                  "transition-transform duration-500 ease-out"
                )}
                style={{ color: colorThief.currentColor }}
              >
                <span
                  className={clsx(
                    colorThief.boxBorderStyle1,
                    "border-t-0 main-wide:border-t main-wide:border-r-0"
                  )}
                />
                <span
                  className={clsx(
                    colorThief.boxBorderStyle2,
                    "border-t-0 main-wide:border-t main-wide:border-r-0"
                  )}
                />
                <ExternalLink
                  className={clsx(
                    "max-w-full text-sm main-wide:text-base font-title",
                    "overflow-hidden whitespace-nowrap text-ellipsis"
                  )}
                  href={`https://www.youtube.com/watch?v=${brief?.ytId}`}
                >
                  {ytMeta?.title}
                </ExternalLink>
                <p
                  className={clsx(
                    "font-title text-xs main-wide:text-sm",
                    "overflow-hidden whitespace-nowrap text-ellipsis",
                    defaultThemeStyle
                  )}
                >
                  {ytMeta?.channelTitle}
                </p>
              </div>
            </div>
            <div className="flex-1" />
            <div>
              <div
                className={clsx(
                  "mb-2",
                  props.forceShowCId || "hidden main-wide:block"
                )}
              >
                {props.backButton && (
                  <button
                    className={clsx(pagerButtonClass, "mr-4")}
                    onClick={props.backButton}
                  >
                    <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
                  </button>
                )}
                <span>{cid && `ID: ${cid}`}</span>
              </div>
              <p className="font-title text-2xl">{brief?.title}</p>
              <p className="font-title text-lg">{brief?.composer}</p>
              <p className="mt-1">
                <span className="inline-block">
                  <span className="text-sm">
                    {brief && `${t("chartCreator")}:`}
                  </span>
                  <span className="ml-2 font-title text-lg">
                    {brief?.chartCreator}
                  </span>
                </span>
                <span className="inline-block ml-3 text-slate-500 dark:text-stone-400 ">
                  <span className="inline-block">
                    {updatedAt && `(${updatedAt})`}
                  </span>
                  <span>
                    {cid && isSample(cid) ? (
                      <span className="ml-2">
                        <International className="inline-block w-5 translate-y-0.5" />
                        <span>{t("isSample")}</span>
                      </span>
                    ) : brief?.published ? (
                      <span className="ml-2">
                        <International className="inline-block w-5 translate-y-0.5" />
                        <span>{t("isPublished")}</span>
                      </span>
                    ) : (
                      <>
                        {/*
              <LinkTwo className="inline-block w-5 translate-y-0.5" />
              <span></span>
            */}
                      </>
                    )}
                  </span>
                  {/*<span className="ml-2">
                <PlayOne
                  className="inline-block w-5 translate-y-0.5"
                  theme="filled"
                />
                <span>{brief.playCount || 0}</span>
              </span>*/}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      {sharedResult && <SharedResultBox result={sharedResult} />}
      {brief && (
        <p className="mt-2">
          <span className="hidden main-wide:inline-block mr-2">
            {t("shareLink")}:
          </span>
          <a
            className={clsx("inline-block py-2", linkStyle1)}
            href={shareLink.path}
            onClick={(e) => e.preventDefault()}
          >
            <span className="main-wide:hidden">{t("shareLink")}</span>
            <span className="hidden main-wide:inline-block">
              {shareLink.url}
            </span>
          </a>
          <span className="inline-block ml-2">{shareLink.buttons}</span>
        </p>
      )}
      {cid && brief && (
        <PlayOption
          cid={cid}
          brief={brief}
          record={props.record}
          locale={props.locale}
        />
      )}
    </>
  );
}
