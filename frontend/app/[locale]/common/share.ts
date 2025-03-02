"use client";

import { ChartBrief, ChartMin } from "@falling-nikochan/chart";
import { useCallback, useEffect, useState } from "react";
import { titleShare, titleShareResult } from "./title";
import { useTranslations } from "next-intl";

export function useShareLink(
  cid: string | undefined,
  brief: ChartMin | ChartBrief | undefined | null,
  resultParam?: string
) {
  const [origin, setOrigin] = useState<string>("");
  const url = resultParam
    ? `${origin}/share/${cid}?result=${resultParam}`
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
        ? titleShareResult(t, cid, brief)
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
  }, [origin, cid, brief, url, resultParam, t]);

  return {
    url,
    toClipboard: hasClipboard ? toClipboard : null,
    toAPI: shareData ? toAPI : null,
  };
}
