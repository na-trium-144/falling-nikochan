"use client";

import { ChartBrief, ChartMin } from "@falling-nikochan/chart";
import { memo, useCallback, useEffect, useState } from "react";
import { titleShare, titleShareResult } from "./title";
import { useTranslations } from "next-intl";
import packageJson from "@/../../package.json" with { type: "json" };
import { Box, modalBg } from "./box";
import Button from "./button";

export function useShareLink(
  cid: string | undefined,
  brief: ChartMin | ChartBrief | undefined | null,
  lang?: string,
  resultParam?: string,
  date?: number | null
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
    ? titleShareResult(t, cid, brief, date ? new Date(date) : undefined)
    : titleShare(t, cid, brief);

  const [hasClipboard, setHasClipboard] = useState<boolean>(false);
  const toClipboard = useCallback(() => {
    // og画像の生成は時間がかかるので、
    // 共有される前にogを1回fetchしておくことにより、
    // cloudflareにキャッシュさせる
    void fetch(process.env.BACKEND_PREFIX + ogPath);
    navigator.clipboard.writeText(
      newTitle + "\n" + origin + sharePath + "?" + shareParams
    );
  }, [ogPath, newTitle, origin, sharePath, shareParams]);
  const [shareData, setShareData] = useState<object | null>(null);
  const toAPI = useCallback(() => {
    void fetch(process.env.BACKEND_PREFIX + ogPath);
    navigator.share(shareData!);
  }, [shareData, ogPath]);
  useEffect(() => {
    setOrigin(window.location.origin);
    setHasClipboard(!!navigator?.clipboard);
  }, []);
  useEffect(() => {
    const shareData = {
      title: resultParam
        ? titleShareResult(t, cid, brief, date ? new Date(date) : undefined)
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

  const [modalOpened, setModalOpened] = useState<boolean>(false);
  const [modalAppearing, setModalAppearing] = useState<boolean>(false);
  const openModal = useCallback(() => {
    setModalOpened(true);
    setTimeout(() => setModalAppearing(true));
  }, []);
  const closeModal = useCallback(() => {
    setModalAppearing(false);
    setTimeout(() => setModalOpened(false), 200);
  }, []);

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
    openModal,
    modal: modalOpened && (
      <ShareImageModal
        modalAppearing={modalAppearing}
        closeModal={closeModal}
        ogPath={ogPath}
      />
    ),
  };
}

interface MProps {
  modalAppearing: boolean;
  closeModal: () => void;
  ogPath: string;
}
const ShareImageModal = memo(function ShareImageModal(props: MProps) {
  const t = useTranslations("share.image");
  return (
    <div
      className={
        modalBg +
        "transition-opacity duration-200 z-30! " +
        (props.modalAppearing ? "ease-in opacity-100 " : "ease-out opacity-0 ")
      }
      onClick={props.closeModal}
    >
      <div className="absolute inset-0">
        <Box
          onClick={(e) => e.stopPropagation()}
          className={
            "absolute inset-0 m-auto w-max h-max max-w-full max-h-full " +
            "flex flex-col items-center " +
            "p-6 " +
            "shadow-lg " +
            "transition-transform duration-200 origin-center " +
            (props.modalAppearing ? "ease-in scale-100 " : "ease-out scale-0 ")
          }
        >
          <p className="text-lg font-title font-bold mb-2">
            &lt; {t("shareImage")} &gt;
          </p>
          <div
            className="max-w-full relative aspect-1200/630 bg-slate-300 "
            style={{
              width:
                `min(` +
                `calc(100dvw - ${((12 + 6) * 2) / 4}rem), ` +
                `calc((100dvh - ${((12 + 6) * 2 + 7 + 2 + 10) / 4}rem) * (1200 / 630)` +
                `)`,
            }}
          >
            <img
              src={process.env.BACKEND_PREFIX + props.ogPath}
              className="absolute inset-0 "
            />
          </div>
          <Button text={t("close")} onClick={props.closeModal} />
        </Box>
      </div>
    </div>
  );
});
