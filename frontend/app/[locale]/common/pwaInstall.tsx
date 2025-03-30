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
}
export function usePWAInstall(): PWAStates {
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [detectedOS, setDetectedOS] = useState<"android" | "ios" | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

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
    if (
      (isStandalone() || process.env.USE_SW) &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener("statechange", () => {
              if (newWorker?.state === "installed") {
                window.location.reload();
              }
            });
          });
        });
    }
  }, []);
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
