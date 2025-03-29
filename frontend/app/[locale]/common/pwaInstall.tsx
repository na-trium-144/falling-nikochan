"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "./button";

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

interface Props {
  className?: string;
}
export function PWAInstall(props: Props) {
  const t = useTranslations("main");
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [detectedOS, setDetectedOS] = useState<"android" | "ios" | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
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
  }, []);

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
          (dismissed || detectedOS === null ? "hidden " : "")
        }
      >
        {deferredPrompt && detectedOS === "android" && (
          <>
            <p>{t("installDesc")}</p>
            <Button
              text={t("install")}
              onClick={() => {
                deferredPrompt.prompt().then(({ outcome }) => {
                  if (outcome === "accepted") {
                    localStorage.setItem("PWADismissed", "1");
                    setDismissed(true);
                  }
                  setDeferredPrompt(null);
                });
              }}
            />
          </>
        )}
        {detectedOS === "ios" && <p>{t("installIOS")}</p>}
        <Button
          text={t("dismiss")}
          onClick={() => {
            localStorage.setItem("PWADismissed", "1");
            setDismissed(true);
          }}
        />
      </div>
    </div>
  );
}
