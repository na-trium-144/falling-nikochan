"use client";

import clsx from "clsx/lite";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import Button from "./button";
import { hasTouch } from "@/scale";
import { Box, WarningBox } from "./box";
import { SlimeSVG } from "./slime";
import { levelBgColors } from "./levelColors";
import ProgressBar from "./progressBar";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export function useStandaloneDetector() {
  const [state, setState] = useState<boolean | null>(null);
  useEffect(() => setState(isStandalone()), []);
  return state;
}
export function isStandalone(): boolean {
  return (
    new URLSearchParams(location.search).get("utm_source") === "homescreen" ||
    new URLSearchParams(location.search).get("utm_source") === "nikochan.twa" ||
    !!sessionStorage.getItem("fromHomeScreen") ||
    window.matchMedia("(display-mode: standalone)").matches ||
    !!(navigator as any).standalone ||
    document.referrer.includes("android-app://")
  );
}
export function useAndroidTWADetector() {
  const [state, setState] = useState<boolean | null>(null);
  useEffect(() => setState(isAndroidTWA()), []);
  return state;
}
export function isAndroidTWA(): boolean {
  return (
    detectOS() === "android" &&
    (new URLSearchParams(location.search).get("utm_source") ===
      "nikochan.twa" ||
      !!sessionStorage.getItem("fromAndroidTWA") ||
      document.referrer.includes("android-app://net.utcode.nikochan.twa/"))
  );
}

export function updatePlayCountForReview() {
  localStorage.setItem(
    "playCountForReview",
    (Number(localStorage.getItem("playCountForReview") || "0") + 1).toString()
  );
  localStorage.setItem("lastPlayedDate", Date.now().toString());
}
export function requestReview(): boolean {
  if (isAndroidTWA()) {
    // ユーザーのインタラクションによってトリガーしないといけない
    // 当初全てのページのpopstateに仕込もうとしていたが、うまくいかなかったので、
    // 現在はトップページおよびfooterのナビゲーションと、ほぼすべてのhistory.back()に仕込んでいる
    // 戻るボタン・戻るジェスチャーを使う人には効かない...
    if (localStorage.getItem("firstOpenDate") === null) {
      localStorage.setItem("firstOpenDate", Date.now().toString());
    }
    const firstOpenDate = Number(localStorage.getItem("firstOpenDate")!);
    const lastReviewDate: number | null = JSON.parse(
      localStorage.getItem("lastReviewDate") || "null"
    );
    const playCount = Number(localStorage.getItem("playCountForReview") || "0");
    const lastPlayedDate: number | null = JSON.parse(
      localStorage.getItem("lastPlayedDate") || "null"
    );
    // インストールから3日以上、lastReviewDateから45日以上、プレイ回数が5回以上、最後のプレイから2h以内で、play,editページ以外の場合
    if (
      Date.now() - firstOpenDate > 3 * 24 * 60 * 60 * 1000 &&
      (lastReviewDate === null ||
        Date.now() - lastReviewDate > 45 * 24 * 60 * 60 * 1000) &&
      playCount >= 5 &&
      lastPlayedDate !== null &&
      Date.now() - lastPlayedDate < 2 * 60 * 60 * 1000
    ) {
      localStorage.setItem("lastReviewDate", Date.now().toString());
      localStorage.removeItem("playCountForReview");
      forceRequestReview();
      return true;
    }
  }
  return false;
}
export function forceRequestReview() {
  console.log("Requesting in-app review");
  location.href = "nikochan-in-app-review://review";
}
export function historyBackWithReview() {
  if (requestReview()) {
    // 短すぎると、in-app-reviewがキャンセルされる?
    setTimeout(() => history.back(), 250);
  } else {
    history.back();
  }
}
export function historyBackWithForceReview() {
  forceRequestReview();
  setTimeout(() => history.back(), 250);
}

interface LinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}
export function LinkWithReview(props: LinkProps) {
  const isAndroidTWA = useAndroidTWADetector();
  const router = useRouter();
  return isAndroidTWA ? (
    <button
      className={clsx(props.className)}
      onClick={() => {
        requestReview();
        router.push(props.href);
      }}
    >
      {props.children}
    </button>
  ) : (
    <Link {...props} prefetch={!process.env.NO_PREFETCH}>
      {props.children}
    </Link>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PWAStates {
  dismissed: boolean;
  dismiss: () => void;
  detectedOS: "android" | "ios" | null;
  deferredPrompt: BeforeInstallPromptEvent | null;
  install: () => void;
}
const PWAContext = createContext<PWAStates>({
  dismissed: false,
  dismiss: () => undefined,
  detectedOS: null,
  deferredPrompt: null,
  install: () => undefined,
});
export const usePWAInstall = () => useContext(PWAContext);
export function detectOS(): "android" | "ios" | null {
  const userAgent = (
    navigator.userAgent ||
    navigator.vendor ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).opera
  ).toLowerCase();
  if (userAgent.includes("android")) {
    return "android";
  } else if (
    (userAgent.match(/iphone|ipad|ipod/) ||
      (userAgent.includes("macintosh") && hasTouch())) &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !(window as any).MSStream
  ) {
    return "ios";
  }
  return null;
}
export function useOSDetector() {
  // undefined: 未検出、null: PCなど、"android" | "ios": 各OS
  const [os, setOS] = useState<"android" | "ios" | null | undefined>(undefined);
  useEffect(() => {
    setOS(detectOS());
  }, []);
  return os;
}

interface InitAssetsState {
  type?: "initAssets";
  state: InitAssetsResult;
  progressNum?: number;
  totalNum?: number;
  progressSize?: number;
}
type InitAssetsResult =
  | "done"
  | "failed"
  | "updating"
  | "noUpdate"
  | "inProgress";
export function PWAInstallProvider(props: { children: ReactNode }) {
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [detectedOS, setDetectedOS] = useState<"android" | "ios" | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // standaloneでない場合はアップデート状態に関わらず表示しないのでnull
  const [workerUpdate, setWorkerUpdate] = useState<null | InitAssetsState>(
    null
  );

  const dismiss = useCallback(() => {
    localStorage.setItem("PWADismissed", "1");
    setDismissed(true);
  }, []);
  useEffect(() => {
    if (isStandalone()) {
      sessionStorage.setItem("fromHomeScreen", "1");
    }
    if (isAndroidTWA()) {
      sessionStorage.setItem("fromAndroidTWA", "1");
    }
    setDismissed(
      isStandalone() || localStorage.getItem("PWADismissed") === "1"
    );
  }, []);

  useEffect(() => {
    switch (detectOS()) {
      case "android": {
        // beforeinstallpromptイベントが発火するのを待つ
        setTimeout(() => setDetectedOS("android"), 100);
        const handler = ((e: BeforeInstallPromptEvent) => {
          e.preventDefault();
          setDeferredPrompt(e);
          setDetectedOS("android");
        }) as EventListener;
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
      }
      case "ios":
        setDetectedOS("ios");
        break;
      case null:
        setDetectedOS(null);
        break;
    }
  }, []);
  const updateFetching = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "development" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.addEventListener("message", (e) => {
        console.warn("sw:", e.data);
      });
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
        if (updateFetching.current !== null) {
          clearTimeout(updateFetching.current);
        }
        updateFetching.current = setTimeout(
          () => void fetch("/worker/checkUpdate"),
          1000
        );
        reg.addEventListener("updatefound", () => {
          if (isStandalone()) {
            setWorkerUpdate({ state: "updating" });
          }
          if (updateFetching.current !== null) {
            clearTimeout(updateFetching.current);
          }
          const newWorker = reg.installing;
          newWorker?.addEventListener("statechange", () => {
            console.log("sw statechange:", newWorker?.state);
            if (newWorker?.state === "activated") {
              // setWorkerUpdate({ state: "done" });
              updateFetching.current = setTimeout(() => {
                fetch("/worker/checkUpdate")
                  .then((res) => {
                    // okの場合、messageイベントで受け取るのでここでは何もしない
                    if (!res.ok) {
                      if (isStandalone()) {
                        setWorkerUpdate({ state: "failed" });
                      }
                    }
                  })
                  .catch(() => {
                    if (isStandalone()) {
                      setWorkerUpdate({ state: "failed" });
                    }
                  });
              }, 1000);
            }
          });
        });
      });
      navigator.serviceWorker.addEventListener("message", (event) => {
        // console.log("Service Worker message:", event.data);
        if (
          typeof event.data === "object" &&
          event.data.type === "initAssets" &&
          isStandalone()
        ) {
          switch ((event.data as InitAssetsState).state) {
            case "done":
            case "failed":
            case "updating":
              setWorkerUpdate(event.data);
              break;
            case "noUpdate":
              setWorkerUpdate((current) => {
                if (current?.state === "updating") {
                  // serviceworkerのinstallのためにupdatingになり、その後assetの更新はない場合
                  return { state: "done" };
                }
                return null;
              });
              break;
            case "inProgress":
              // ignore
              break;
            default:
              console.warn("Unknown worker update state:", event.data.state);
              break;
          }
        }
      });
    }
  }, []);
  useEffect(() => {
    if (workerUpdate?.state === "done" || workerUpdate?.state === "failed") {
      const t = setTimeout(() => setWorkerUpdate(null), 3000);
      return () => clearTimeout(t);
    }
  }, [workerUpdate]);
  const install = useCallback(() => {
    deferredPrompt?.prompt().then(({ outcome }) => {
      if (outcome === "accepted") {
        // localStorage.setItem("PWADismissed", "1");
        setDismissed(true);
      }
      setDeferredPrompt(null);
    });
  }, [deferredPrompt]);

  const t = useTranslations("main.pwa");
  const pathname = usePathname();

  return (
    <PWAContext.Provider
      value={{
        dismissed,
        dismiss,
        detectedOS,
        deferredPrompt,
        install,
      }}
    >
      {props.children}
      <Box
        classNameOuter={clsx(
          "fn-pwa-install",
          "transition-all duration-200 origin-bottom",
          workerUpdate !== null && !pathname.match(/^\/[a-zA-Z-]*\/(play|edit)/)
            ? "ease-in scale-100 opacity-100"
            : "ease-out scale-0 opacity-0"
        )}
        padding={2}
      >
        {workerUpdate?.state === "updating" ? (
          <>
            <SlimeSVG />
            {t("updating")}
            {/*workerUpdate?.progressSize !== undefined && (
              <span className="ml-2 text-sm">
                (
                <span className="inline-block mr-1 min-w-max w-8 text-center">
                  {/* 不正確? 実際にはダウンロード時も保存時も圧縮されている * /}
                  {(workerUpdate.progressSize / 1024 / 1024).toFixed(2)}
                </span>
                MB)
              </span>
            )*/}
            {workerUpdate?.progressNum !== undefined && (
              <ProgressBar
                className="absolute bottom-1 inset-x-2.5 "
                fixedColor={levelBgColors[1]}
                value={
                  (workerUpdate?.progressNum || 0) /
                  (workerUpdate?.totalNum || 1)
                }
              />
            )}
          </>
        ) : workerUpdate?.state === "done" ? (
          t("updateDone")
        ) : workerUpdate?.state === "failed" ? (
          t("updateFailed")
        ) : null}
      </Box>
    </PWAContext.Provider>
  );
}

// トップページに表示するPWAの案内表示
export function PWAInstallMain() {
  const t = useTranslations("main.pwa");
  const pwa = usePWAInstall();
  return (
    <WarningBox hidden={pwa.dismissed || pwa.detectedOS === null}>
      <PWAInstallDesc />
      <Button text={t("dismiss")} onClick={pwa.dismiss} />
    </WarningBox>
  );
}

// dismissed かどうかはチェックしないが、
// standaloneとPCでは非表示にする
export function PWAInstallDesc(props: { block?: boolean; className?: string }) {
  const t = useTranslations("main.pwa");
  const pwa = usePWAInstall();
  const isStandalone = useStandaloneDetector();
  if (isStandalone === false) {
    if (pwa.detectedOS === "android") {
      if (pwa.deferredPrompt) {
        if (props.block) {
          return (
            <div className={clsx(props.className)}>
              <p>{t("installWithPrompt")}</p>
              <Button text={t("install")} onClick={pwa.install} />
            </div>
          );
        } else {
          return (
            <>
              <p>{t("installWithPrompt")}</p>
              <Button text={t("install")} onClick={pwa.install} />
            </>
          );
        }
      } else {
        return (
          <p className={clsx(props.className)}>{t("installWithoutPrompt")}</p>
        );
      }
    } else if (pwa.detectedOS === "ios") {
      return <p className={clsx(props.className)}>{t("installIOS")}</p>;
    }
  }
  return null;
}
