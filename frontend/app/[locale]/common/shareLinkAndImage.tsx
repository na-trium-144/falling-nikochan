"use client";

import { ChartBrief, ChartMin } from "@falling-nikochan/chart";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { titleShare, titleShareResult } from "./title";
import { useTranslations } from "next-intl";
import packageJson from "@/../../package.json" with { type: "json" };
import { Box, modalBg } from "./box";
import Button from "./button";
import { SlimeSVG } from "./slime";
import saveAs from "file-saver";

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

  const shareImageCtx = useShareImageModalContext();
  const openModal = useCallback(
    () => shareImageCtx.openModal(ogPath, cid || "undefined"),
    [shareImageCtx, ogPath, cid]
  );

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
  };
}

export interface ShareImageModalState {
  openModal: (ogPath: string, cid: string) => void;
}
const ShareImageModalContext = createContext<ShareImageModalState>({
  openModal: () => undefined,
});
export const useShareImageModalContext = () =>
  useContext(ShareImageModalContext);

export function ShareImageModalProvider(props: { children: React.ReactNode }) {
  const [modalAppearing, setModalAppearing] = useState<boolean>(false);
  const [modalOpened, setModalOpened] = useState<boolean>(false);
  const [ogPath, setOgPath] = useState<string>("");
  const [cid, setCid] = useState<string>("");

  const openModal = useCallback((ogPath: string, cid: string) => {
    setOgPath(ogPath);
    setCid(cid);
    setModalOpened(true);
    setTimeout(() => setModalAppearing(true));
  }, []);

  const closeModal = useCallback(() => {
    setModalAppearing(false);
    setTimeout(() => setModalOpened(false), 200);
  }, []);

  const t = useTranslations("share.image");
  const [imageBlob, setImageBlob] = useState<Blob>();
  useEffect(() => {
    if (modalOpened) {
      fetch(process.env.BACKEND_PREFIX + ogPath).then((r) =>
        r.blob().then((b) => setImageBlob(b))
      );
    }
  }, [ogPath, modalOpened]);

  const [hasClipboard, setHasClipboard] = useState<boolean>(false);
  const toClipboard = useCallback(() => {
    const clipboardItem = new ClipboardItem({ "image/png": imageBlob! });
    void navigator.clipboard.write([clipboardItem]);
  }, [imageBlob]);
  const [shareData, setShareData] = useState<object | null>(null);
  const toAPI = useCallback(() => {
    navigator.share(shareData!);
  }, [shareData]);
  useEffect(() => {
    setHasClipboard(!!navigator?.clipboard && "write" in navigator.clipboard);
  }, []);
  useEffect(() => {
    if (imageBlob) {
      const shareData = {
        files: [
          new File([imageBlob], `${cid}.png`, {
            type: "image/png",
          }),
        ],
      };
      if (
        !!navigator?.share &&
        !!navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        setShareData(shareData);
      }
    }
  }, [cid, imageBlob]);

  return (
    <ShareImageModalContext.Provider value={{ openModal }}>
      {props.children}
      {modalOpened && (
        <div
          className={
            modalBg +
            "transition-opacity duration-200 z-30! " +
            (modalAppearing ? "ease-in opacity-100 " : "ease-out opacity-0 ")
          }
          onClick={closeModal}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-12">
            <Box
              onClick={(e) => e.stopPropagation()}
              className={
                "absolute inset-0 m-auto w-max h-max max-w-full max-h-full " +
                "flex flex-col items-center text-center " +
                "p-6 " +
                "shadow-lg " +
                "overflow-y-auto " +
                "transition-transform duration-200 origin-center " +
                (modalAppearing ? "ease-in scale-100 " : "ease-out scale-0 ")
              }
            >
              <p className="text-lg font-title font-bold mb-2">
                &lt; {t("shareImage")} &gt;
              </p>
              <div
                className="max-w-full relative aspect-1200/630 bg-slate-300 mb-2 isolate "
                style={{
                  width:
                    `min(` +
                    `45rem, ` +
                    // 12: 外側margin
                    // 6: padding
                    // 7+2: &lt; {t("shareImage")} &gt;
                    // 10: Button
                    `calc(100dvw - ${((12 + 6) * 2) / 4}rem), ` +
                    `max(20rem, calc((100dvh - ${((12 + 6) * 2 + 7 + 2 + 2 + 10 + 2 + 10) / 4}rem) * (1200 / 630))` +
                    `)`,
                }}
              >
                <img
                  src={process.env.BACKEND_PREFIX + ogPath}
                  className="absolute inset-0 "
                />
                <div className="absolute inset-0 bg-gray-500/50 backdrop-blur-xs -z-10 flex flex-row items-center justify-center ">
                  <SlimeSVG />
                  Loading...
                </div>
              </div>
              {imageBlob && (
                <p className="mb-1">
                  <Button
                    text={t("download")}
                    onClick={() => saveAs(imageBlob, `${cid}.png`)}
                  />
                  <span className="inline-block">
                    {hasClipboard && (
                      <Button text={t("copy")} onClick={toClipboard} />
                    )}
                    {shareData && <Button text={t("share")} onClick={toAPI} />}
                  </span>
                </p>
              )}
              <Button text={t("close")} onClick={closeModal} />
            </Box>
          </div>
        </div>
      )}
    </ShareImageModalContext.Provider>
  );
}
