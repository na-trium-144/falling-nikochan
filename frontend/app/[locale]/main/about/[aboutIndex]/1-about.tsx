"use client";

import { PWAInstallDesc } from "@/common/pwaInstall";
import { useTranslations } from "next-intl";

export function AboutContent1() {
  const t = useTranslations("about.1");
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
      <PWAInstallDesc block />
    </>
  );
}
