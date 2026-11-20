"use client";

import { historyBackWithReview } from "@/common/pwaInstall";
import { useTranslations } from "@/intlProvider";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";
import clsx from "clsx";

export function BackButton() {
  const t = useTranslations("main");
  return (
    <button
      className={clsx("no-mobile w-max mb-3 mr-3 fn-link-1 space-x-2")}
      onClick={() => {
        historyBackWithReview();
      }}
    >
      <ArrowLeft className="inline-block align-middle" />
      <span>{t("back")}</span>
    </button>
  );
}
