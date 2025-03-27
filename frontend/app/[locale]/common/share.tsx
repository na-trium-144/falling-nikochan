"use client";

import { ChartBrief, ChartMin } from "@falling-nikochan/chart";
import { useCallback, useEffect, useState } from "react";
import { titleShare, titleShareResult } from "./title";
import { useTranslations } from "next-intl";
import packageJson from "@/../../package.json" with { type: "json" };

export function useShareLink(
  cid: string | undefined,
  brief: ChartMin | ChartBrief | undefined | null,
  lang?: string,
  resultParam?: string,
  date?: Date,
) {
  const [origin, setOrigin] = useState<string>("");
  const searchParams = new URLSearchParams();
  const t = useTranslations("share");

  // /route/src/share.ts 内で指定しているクエリパラメータと順番をあわせる
  searchParams.set("lang", lang || "en");
  if (resultParam) searchParams.set("result", resultParam);
  const sharePath = `/share/${cid}`;
  const shareParams = searchParams.toString();

  searchParams.set("v", packageJson.version);
  const ogPath = resultParam
    ? `/og/result/${cid}?${searchParams.toString()}`
    : `/og/share/${cid}?${searchParams.toString()}`;

  // /route/src/share.ts 内で指定しているタイトルとおなじ
  const newTitle = resultParam
    ? titleShareResult(t, cid, brief, date)
    : titleShare(t, cid, brief);

  const [hasClipboard, setHasClipboard] = useState<boolean>(false);
  const toClipboard = useCallback(() => {
    // og画像の生成は時間がかかるので、
    // 共有される前にogを1回fetchしておくことにより、
    // cloudflareにキャッシュさせる
    void fetch(ogPath);
    navigator.clipboard.writeText(
      newTitle + "\n" + origin + sharePath + "?" + shareParams,
    );
  }, [ogPath, newTitle, origin, sharePath, shareParams]);
  const [shareData, setShareData] = useState<object | null>(null);
  const toAPI = useCallback(() => {
    void fetch(ogPath);
    navigator.share(shareData!);
  }, [shareData, ogPath]);
  useEffect(() => {
    setOrigin(window.location.origin);
    setHasClipboard(!!navigator?.clipboard);
  }, []);
  useEffect(() => {
    const shareData = {
      title: resultParam
        ? titleShareResult(t, cid, brief, date!)
        : titleShare(t, cid, brief),
      url: origin + sharePath + "?" + shareParams,
    };
    if (
      !!navigator?.share &&
      !!navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      setShareData(shareData);
    }
  }, [origin, cid, brief, sharePath, shareParams, resultParam, t, date]);

  return {
    url: (
      <>
        {origin}
        {sharePath}
        <span className="text-slate-500 dark:text-stone-400 ">
          ?{shareParams}
        </span>
      </>
    ),
    path: sharePath + "?" + shareParams,
    toClipboard: hasClipboard ? toClipboard : null,
    toAPI: shareData ? toAPI : null,
  };
}
