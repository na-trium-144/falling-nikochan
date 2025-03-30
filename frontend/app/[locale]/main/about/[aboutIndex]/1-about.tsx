"use client";

import Button from "@/common/button";
import { usePWAInstall } from "@/common/pwaInstall";
import { useTranslations } from "next-intl";

export function AboutContent1() {
  const t = useTranslations("about.1");
  const pwa = usePWAInstall();
  return (
    <>
      <div className="mb-4">
        <p>{t("content1")}</p>
        <p>{t("content2")}</p>
      </div>
      <div className="mb-4">
        <p>{t("content3")}</p>
        <p>{t("content4")}</p>
      </div>
      <div className="mb-4">
        <p>{t("installDesc")}</p>
        {pwa.detectedOS === "android" && (
          <Button text={t("install")} onClick={pwa.install} />
        )}
        {pwa.detectedOS === "ios" && <p>{t("installIOS")}</p>}
      </div>
    </>
  );
}
