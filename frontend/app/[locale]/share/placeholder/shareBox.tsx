"use client";

import { PlayOption } from "./playOption.js";
import {
  ChartBrief,
  RecordGetSummary,
  ResultParams,
} from "@falling-nikochan/chart";
import { useEffect, useRef, useState } from "react";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube.js";
import Button from "@/common/button.js";
import { linkStyle1 } from "@/common/linkStyle.js";
import { isSample } from "@falling-nikochan/chart";
import { ArrowLeft, International } from "@icon-park/react";
import { useTranslations } from "next-intl";
import { useShareLink } from "@/common/share.js";
import { SharedResultBox } from "./sharedResult.js";
import { pagerButtonClass } from "@/common/pager.jsx";

interface Props {
  cid: string | undefined;
  brief: ChartBrief | null;
  record: RecordGetSummary[];
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

  return (
    <>
      <div
        className={
          "flex flex-col space-y-2 " +
          "main-wide:space-y-0 main-wide:flex-row-reverse main-wide:items-center "
        }
      >
        <FlexYouTube
          fixedSide="width"
          className={"w-full main-wide:basis-1/3 share-yt-wide:w-80 "}
          id={brief?.ytId}
          control={true}
          ytPlayer={ytPlayer}
        />
        <div className="main-wide:flex-1 main-wide:self-start">
          <div
            className={
              "mb-2 " + (props.forceShowCId ? "" : "hidden main-wide:block ")
            }
          >
            {props.backButton && (
              <button
                className={pagerButtonClass + "mr-4 "}
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
      {sharedResult && <SharedResultBox result={sharedResult} />}
      {brief && (
        <p className="mt-2">
          <span className="hidden main-wide:inline-block mr-2">
            {t("shareLink")}:
          </span>
          <a
            className={"inline-block py-2 " + linkStyle1}
            href={shareLink.path}
            onClick={(e) => e.preventDefault()}
          >
            <span className="main-wide:hidden">{t("shareLink")}</span>
            <span className="hidden main-wide:inline-block">
              {shareLink.url}
            </span>
          </a>
          <span className="inline-block ml-2 space-x-1">
            {shareLink.toClipboard && (
              <Button text={t("copy")} onClick={shareLink.toClipboard} />
            )}
            {shareLink.toAPI && (
              <Button text={t("share")} onClick={shareLink.toAPI} />
            )}
          </span>
        </p>
      )}
      {cid && brief && (
        <PlayOption cid={cid} brief={brief} record={props.record} />
      )}
    </>
  );
}
