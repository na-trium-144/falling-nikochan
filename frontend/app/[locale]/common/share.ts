"use client";

import { ChartBrief, ChartMin } from "@falling-nikochan/chart";
import { useCallback, useEffect, useState } from "react";
import { titleShare, titleShareResult } from "./title";
import { useTranslations } from "next-intl";

export function useShareLink(
  cid: string | undefined,
  brief: ChartMin | ChartBrief | undefined | null,
  lang?: string,
  resultParam?: string,
  date?: Date
) {
  const [origin, setOrigin] = useState<string>("");
  const searchParams = new URLSearchParams();
  if (lang) searchParams.set("lang", lang);
  if (resultParam) searchParams.set("result", resultParam);
  const path = searchParams.toString()
    ? `/share/${cid}?${searchParams.toString()}`
    : `/share/${cid}`;
  const url = origin + path;
  const ogPath = resultParam
    ? `/og/result/${cid}?${searchParams.toString()}`
    : `/og/share/${cid}?${searchParams.toString()}`;
  const [hasClipboard, setHasClipboard] = useState<boolean>(false);
  const toClipboard = useCallback(() => {
    // og画像の生成は時間がかかるので、
    // 共有される前にogを1回fetchしておくことにより、
    // cloudflareにキャッシュさせる
    void fetch(ogPath);
    navigator.clipboard.writeText(url);
  }, [url, ogPath]);
  const [shareData, setShareData] = useState<object | null>(null);
  const toAPI = useCallback(() => {
    void fetch(ogPath);
    navigator.share(shareData!);
  }, [shareData, ogPath]);
  useEffect(() => {
    setOrigin(window.location.origin);
    setHasClipboard(!!navigator?.clipboard);
  }, []);
  const t = useTranslations("share");
  useEffect(() => {
    const shareData = {
      title: resultParam
        ? titleShareResult(t, cid, brief, date!)
        : titleShare(t, cid, brief),
      url: url,
    };
    if (
      !!navigator?.share &&
      !!navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      setShareData(shareData);
    }
  }, [origin, cid, brief, url, resultParam, t, date]);

  return {
    url,
    path,
    toClipboard: hasClipboard ? toClipboard : null,
    toAPI: shareData ? toAPI : null,
  };
}
