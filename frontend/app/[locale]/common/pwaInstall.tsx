"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "./button";

export function useStandaloneDetector() {
  const [state, setState] = useState<boolean>(false);
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

interface PWAStates {
  dismissed: boolean;
  dismiss: () => void;
  detectedOS: "android" | "ios" | null;
  deferredPrompt: BeforeInstallPromptEvent | null;
  install: () => void;
  workerUpdate: null | "updating" | "done";
}
export function usePWAInstall(): PWAStates {
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [detectedOS, setDetectedOS] = useState<"android" | "ios" | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [workerUpdate, setWorkerUpdate] = useState<null | "updating" | "done">(
    null,
  );

  const dismiss = useCallback(() => {
    localStorage.setItem("PWADismissed", "1");
    setDismissed(true);
  }, []);
  useEffect(() => {
    setDismissed(
      isStandalone() || localStorage.getItem("PWADismissed") === "1",
    );
    const userAgent = (
      navigator.userAgent ||
      navigator.vendor ||
      (window as any).opera
    ).toLowerCase();
    if (userAgent.includes("android")) {
      const handler = ((e: BeforeInstallPromptEvent) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setDetectedOS("android");
      }) as EventListener;
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    } else if (
      userAgent.match(/iphone|ipad|ipod/) &&
      !(window as any).MSStream
    ) {
      setDetectedOS("ios");
    }

    let updateFetching: ReturnType<typeof setTimeout> | null = null;
    if (
      (isStandalone() || process.env.USE_SW) &&
      process.env.NODE_ENV !== "development" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
        console.log("registered service worker");
        updateFetching = setTimeout(() => {
          fetch("/worker/checkUpdate").then(async (res) => {
            const { version, commit } = await res.json();
            if (version) {
              setWorkerUpdate("updating");
              fetch("/worker/initAssets?clearOld=1").then(() => {
                setWorkerUpdate("done");
                setTimeout(() => window.location.reload(), 1000);
              });
            } else if (commit) {
              setWorkerUpdate("updating");
              fetch("/worker/initAssets").then(() => {
                setWorkerUpdate("done");
              });
            }
          });
        }, 1000);

        reg.addEventListener("updatefound", () => {
          setWorkerUpdate("updating");
          if (updateFetching !== null) clearTimeout(updateFetching);
          const newWorker = reg.installing;
          newWorker?.addEventListener("statechange", () => {
            if (newWorker?.state === "installed") {
              setWorkerUpdate("done");
              // 適当に遅延させる
              setTimeout(() => window.location.reload(), 1000);
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
    if (workerUpdate === "done") {
      const t = setTimeout(() => setWorkerUpdate(null), 3000);
      return () => clearTimeout(t);
    }
  }, [workerUpdate]);
  const install = useCallback(() => {
    deferredPrompt?.prompt().then(({ outcome }) => {
      if (outcome === "accepted") {
        localStorage.setItem("PWADismissed", "1");
        setDismissed(true);
      }
      setDeferredPrompt(null);
    });
  }, [deferredPrompt]);

  return {
    dismissed,
    dismiss,
    detectedOS,
    deferredPrompt,
    install,
    workerUpdate,
  };
}
interface Props {
  className?: string;
  pwa: PWAStates;
}
export function PWAInstallMain(props: Props) {
  const t = useTranslations("main");
  const { pwa } = props;
  return (
    <div
      className={
        "text-center flex items-center justify-center text-sm " +
        (props.className || "")
      }
    >
      <div
        className={
          "text-center px-3 py-2 h-max rounded-lg bg-amber-200/75 dark:bg-amber-800/75 " +
          (pwa.dismissed || pwa.detectedOS === null ? "hidden " : "")
        }
      >
        {pwa.deferredPrompt && pwa.detectedOS === "android" && (
          <>
            <p>{t("installDesc")}</p>
            <Button text={t("install")} onClick={pwa.install} />
          </>
        )}
        {pwa.detectedOS === "ios" && <p>{t("installIOS")}</p>}
        <Button text={t("dismiss")} onClick={pwa.dismiss} />
      </div>
    </div>
  );
}
