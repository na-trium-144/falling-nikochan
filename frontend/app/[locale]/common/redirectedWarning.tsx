"use client";

import Caution from "@icon-park/react/lib/icons/Caution";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function RedirectedWarning() {
  const t = useTranslations("main");
  const [showRedirectWarning, setShowRedirectWarning] =
    useState<boolean>(false);
  useEffect(
    () =>
      setShowRedirectWarning(
        new URLSearchParams(window.location.search).has("redirected"),
      ),
    [],
  );

  return (
    <div
      className={
        "text-center text-sm mx-6 my-2 px-3 py-2 h-max " +
        "rounded-lg bg-amber-200/75 dark:bg-amber-800/75 " +
        (showRedirectWarning ? "" : "hidden ")
      }
    >
      <Caution className="inline-block align-middle mr-1 " />
      {t.rich("redirected", {
        url: () => (
          <span>
            nikochan.
            <wbr />
            utcode.
            <wbr />
            net
          </span>
        ),
      })}
    </div>
  );
}
