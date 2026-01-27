"use client";

import clsx from "clsx/lite";
import { ChartBrief, ChartMin } from "@falling-nikochan/chart";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import packageJson from "@/../../package.json" with { type: "json" };
import { Box } from "./box";
import Button from "./button";
import { SlimeSVG } from "./slime";
import saveAs from "file-saver";
import { useDelayedDisplayState } from "./delayedDisplayState";
import { useOSDetector } from "./pwaInstall";
import Pic from "@icon-park/react/lib/icons/Pic";
import Select from "./select";

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
  // use encodeURIComponent to silence CodeQL false positive alert
  const sharePath = `/share/${encodeURIComponent(cid || "")}`;
  const shareParams = searchParams.toString();

  searchParams.set("v", packageJson.version);
  const ogPath = resultParam
    ? `/og/result/${encodeURIComponent(cid || "")}?${searchParams.toString()}`
    : `/og/share/${encodeURIComponent(cid || "")}?${searchParams.toString()}`;

  // /route/src/share.ts 内で指定しているタイトルとおなじ
  let newTitle: string = brief?.composer
    ? t("titleWithComposer", {
        title: brief?.title,
        composer: brief?.composer,
        cid: cid || "",
      })
    : t("title", {
        title: brief?.title || "",
        cid: cid || "",
      });
  if (resultParam) {
    if (date) {
      newTitle = t("titleWithResult", {
        date: new Date(date).toLocaleDateString(),
        title: newTitle,
      });
    } else {
      newTitle = t("titleWithResultNoDate", {
        title: newTitle,
      });
    }
  }

  const [hasClipboard, setHasClipboard] = useState<boolean>(false);
  const toClipboard = useCallback(
    (withTitle: boolean = false) => {
      // og画像の生成は時間がかかるので、
      // 共有される前にogを1回fetchしておくことにより、
      // cloudflareにキャッシュさせる
      void fetch(process.env.BACKEND_PREFIX + ogPath);
      if (withTitle) {
        navigator.clipboard.writeText(
          newTitle +
            " #fallingnikochan\n" +
            origin +
            sharePath +
            "?" +
            shareParams
        );
      } else {
        navigator.clipboard.writeText(origin + sharePath + "?" + shareParams);
      }
    },
    [ogPath, newTitle, origin, sharePath, shareParams]
  );
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
      title: newTitle + " #fallingnikochan",
      text: newTitle + " #fallingnikochan",
      url: origin + sharePath + "?" + shareParams,
    };
    if (
      !!navigator?.share &&
      !!navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      setShareData(shareData);
    }
  }, [origin, newTitle, sharePath, shareParams]);
  const xPostIntentParams = new URLSearchParams();
  xPostIntentParams.set("hashtags", "fallingnikochan");
  xPostIntentParams.set("related", "nikochan144");
  xPostIntentParams.set("text", newTitle);
  xPostIntentParams.set("url", origin + sharePath + "?" + shareParams);
  const xPostIntent =
    "https://twitter.com/intent/tweet?" + xPostIntentParams.toString();

  const shareImageCtx = useShareImageModalContext();
  const openModal = useCallback(
    () => shareImageCtx.openModal(ogPath, cid || "undefined"),
    [shareImageCtx, ogPath, cid]
  );

  const detectedOS = useOSDetector();

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
    buttons: (
      <>
        <Button
          className="mx-0.5"
          text={t("copyURL")}
          onClick={hasClipboard ? toClipboard : undefined}
        />
        {detectedOS === undefined ? (
          // placeholder dummy button
          <Button className="mx-0.5" text={t("share")} />
        ) : detectedOS === null ? (
          <Select
            className="mx-0.5"
            options={[
              { value: "copyForShare", label: t("copyForShare") },
              { value: "xPost", label: t("xPost") },
            ]}
            onSelect={(value: "copyForShare" | "xPost") => {
              if (value === "copyForShare" && hasClipboard) {
                toClipboard(true);
              } else if (value === "xPost") {
                window.open(xPostIntent, "_blank")?.focus();
              }
            }}
          >
            {t("share")}
          </Select>
        ) : (
          // native share API on mobile
          <Button
            className="mx-0.5"
            text={t("share")}
            onClick={toAPI}
            disabled={!shareData}
          />
        )}
      </>
    ),
    modalButton: (
      <Button className="mx-0.5" onClick={openModal}>
        <Pic className="inline-block align-middle " />
      </Button>
    ),
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
  const [modalOpened, modalAppearing, setModalOpened] =
    useDelayedDisplayState(200);
  const [ogPath, setOgPath] = useState<string>("");
  const [cid, setCid] = useState<string>("");

  const openModal = useCallback(
    (ogPath: string, cid: string) => {
      setOgPath(ogPath);
      setCid(cid);
      setModalOpened(true);
    },
    [setModalOpened]
  );

  const closeModal = useCallback(() => {
    setModalOpened(false);
  }, [setModalOpened]);

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

  const detectedOS = useOSDetector();

  return (
    <ShareImageModalContext.Provider value={{ openModal }}>
      {props.children}
      {modalOpened && (
        <div
          className={clsx(
            "fn-modal-bg",
            "transition-opacity duration-200 z-30!",
            modalAppearing ? "ease-in opacity-100" : "ease-out opacity-0"
          )}
          onClick={closeModal}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-12 grid place-content-center place-items-center grid-rows-1 grid-cols-1">
            <Box
              onClick={(e) => e.stopPropagation()}
              classNameOuter={clsx(
                "w-max h-max max-w-full max-h-full",
                "shadow-modal",
                "transition-transform duration-200 origin-center",
                modalAppearing ? "ease-in scale-100" : "ease-out scale-0"
              )}
              classNameInner={clsx("flex flex-col items-center text-center")}
              scrollableY
              padding={6}
            >
              <p className="text-lg font-title font-semibold mb-2">
                &lt; {t("shareImage")} &gt;
              </p>
              <div
                className="max-w-full relative aspect-1200/630 bg-slate-300 mb-2 isolate "
                style={{
                  width:
                    "min(45rem, calc(100dvw - 9rem), max(20rem, calc((100dvh - 17.25rem) * (1200 / 630)))",
                  // `min(` +
                  // `45rem, ` +
                  // // 12: 外側margin
                  // // 6: padding
                  // // 7+2: &lt; {t("shareImage")} &gt;
                  // // 10: Button
                  // `calc(100dvw - ${((12 + 6) * 2) / 4}rem), ` +
                  // `max(20rem, calc((100dvh - ${((12 + 6) * 2 + 7 + 2 + 2 + 10 + 2 + 10) / 4}rem) * (1200 / 630))` +
                  // `)`,
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
                    className="mx-0.5"
                    text={t("download")}
                    onClick={() => saveAs(imageBlob, `${cid}.png`)}
                  />
                  <>
                    <Button
                      className="mx-0.5"
                      text={t("copyImage")}
                      onClick={hasClipboard ? toClipboard : undefined}
                    />
                    {detectedOS === undefined ? null : detectedOS ===
                      null ? null : (
                      // native share API on mobile
                      <Button
                        className="mx-0.5"
                        text={t("share")}
                        onClick={toAPI}
                        disabled={!shareData}
                      />
                    )}
                  </>{" "}
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
