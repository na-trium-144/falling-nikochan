"use client";

import Caution from "@icon-park/react/lib/icons/Caution";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { WarningBox } from "./box";

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
    <WarningBox hidden={!showRedirectWarning}>
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
    </WarningBox>
  );
}
