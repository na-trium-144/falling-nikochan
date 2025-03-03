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
  const url = searchParams.toString()
    ? `${origin}/share/${cid}?${searchParams.toString()}`
    : `${origin}/chart/${cid}`;
  const [hasClipboard, setHasClipboard] = useState<boolean>(false);
  const toClipboard = useCallback(
    () => navigator.clipboard.writeText(url),
    [url]
  );
  const [shareData, setShareData] = useState<object | null>(null);
  const toAPI = useCallback(() => navigator.share(shareData!), [shareData]);
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
    toClipboard: hasClipboard ? toClipboard : null,
    toAPI: shareData ? toAPI : null,
  };
}
