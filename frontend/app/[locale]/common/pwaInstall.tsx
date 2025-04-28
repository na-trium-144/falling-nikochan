"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import Button from "./button";
import { hasTouch } from "@/scale";

export function useStandaloneDetector() {
  const [state, setState] = useState<boolean | null>(null);
  useEffect(() => setState(isStandalone()), []);
  return state;
}
export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone ||
    document.referrer.includes("android-app://")
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
  workerUpdate: null | "updating" | "done" | "failed";
}
const PWAContext = createContext<PWAStates>({
  dismissed: false,
  dismiss: () => undefined,
  detectedOS: null,
  deferredPrompt: null,
  install: () => undefined,
  workerUpdate: null,
});
export const usePWAInstall = () => useContext(PWAContext);
export function PWAInstallProvider(props: { children: ReactNode }) {
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [detectedOS, setDetectedOS] = useState<"android" | "ios" | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [workerUpdate, setWorkerUpdate] = useState<
    null | "updating" | "done" | "failed"
  >(null);

  const dismiss = useCallback(() => {
    localStorage.setItem("PWADismissed", "1");
    setDismissed(true);
  }, []);
  useEffect(() => {
    setDismissed(
      isStandalone() || localStorage.getItem("PWADismissed") === "1",
    );
  }, []);
  useEffect(() => {
    const userAgent = (
      navigator.userAgent ||
      navigator.vendor ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).opera
    ).toLowerCase();
    if (userAgent.includes("android")) {
      // beforeinstallpromptイベントが発火するのを待つ
      setTimeout(() => setDetectedOS("android"), 100);
      const handler = ((e: BeforeInstallPromptEvent) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setDetectedOS("android");
      }) as EventListener;
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    } else if (
      (userAgent.match(/iphone|ipad|ipod/) ||
        (userAgent.includes("macintosh") && hasTouch())) &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !(window as any).MSStream
    ) {
      setDetectedOS("ios");
    }
  }, []);
  useEffect(() => {
    let updateFetching: ReturnType<typeof setTimeout> | null = null;
    if (
      process.env.NODE_ENV !== "development" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
        updateFetching = setTimeout(() => {
          fetch("/worker/checkUpdate")
            .then(async (res) => {
              if (res.ok) {
                const { /*version,*/ commit } = await res.json();
                // if (version) {
                //   setWorkerUpdate("updating");
                //   fetch("/worker/initAssets?clearOld=1")
                if (commit) {
                  setWorkerUpdate("updating");
                  fetch("/worker/initAssets?clearOld=1")
                    .then((res) => {
                      if (res.ok) {
                        setWorkerUpdate("done");
                      } else {
                        setWorkerUpdate("failed");
                      }
                    })
                    .catch(() => setWorkerUpdate("failed"));
                }
              }
            })
            .catch(() => undefined);
        }, 1000);

        reg.addEventListener("updatefound", () => {
          setWorkerUpdate("updating");
          if (updateFetching !== null) clearTimeout(updateFetching);
          const newWorker = reg.installing;
          newWorker?.addEventListener("statechange", () => {
            if (newWorker?.state === "installed") {
              setWorkerUpdate("done");
            }
          });
        });
      });
    }
    return () => {
      if (updateFetching !== null) clearTimeout(updateFetching);
    };
  }, []);
  useEffect(() => {
    if (workerUpdate === "done" || workerUpdate === "failed") {
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

  return (
    <PWAContext.Provider
      value={{
        dismissed,
        dismiss,
        detectedOS,
        deferredPrompt,
        install,
        workerUpdate,
      }}
    >
      {props.children}
    </PWAContext.Provider>
  );
}
export function PWAInstallMain() {
  const t = useTranslations("main.pwa");
  const pwa = usePWAInstall();
  return (
    <div
      className={
        "text-center text-sm mx-6 my-2 px-3 py-2 h-max " +
        "rounded-lg bg-amber-200/75 dark:bg-amber-800/75 " +
        (pwa.dismissed || pwa.detectedOS === null ? "hidden " : "")
      }
    >
      <PWAInstallDesc />
      <Button text={t("dismiss")} onClick={pwa.dismiss} />
    </div>
  );
}

// dismissed かどうかはチェックしないが、
// standaloneとPCでは非表示にする
export function PWAInstallDesc() {
  const t = useTranslations("main.pwa");
  const pwa = usePWAInstall();
  const isStandalone = useStandaloneDetector();
  if (isStandalone === false) {
    if (pwa.detectedOS === "android") {
      if (pwa.deferredPrompt) {
        return (
          <>
            <p>{t("installWithPrompt")}</p>
            <Button text={t("install")} onClick={pwa.install} />
          </>
        );
      } else {
        return <p>{t("installWithoutPrompt")}</p>;
      }
    } else if (pwa.detectedOS === "ios") {
      return <p>{t("installIOS")}</p>;
    }
  }
  return null;
}
