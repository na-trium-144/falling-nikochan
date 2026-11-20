"use client";

import clsx from "clsx/lite";
import { useState } from "react";
import Input from "@/common/input.js";
import { ExternalLink } from "@/common/extLink.js";
import { CidSchema } from "@falling-nikochan/chart";
import { useTranslations } from "@/intlProvider";
import * as v from "valibot";
import { SlimeSVG } from "@/common/slime.js";
import {
  isInsideFrame,
  isStandalone,
  useSafariDetector,
} from "@/common/pwaInstall.js";
import { useRouter } from "next/navigation";
import { captureAndWrap, fetchBackend, formatError } from "@/common/fetch.js";
import { markAsExpected } from "@/common/apiError.js";
import Caution from "@icon-park/react/lib/icons/Caution";

export function EditCidInput({ locale }: { locale: string }) {
  const t = useTranslations("main.edit");
  const te = useTranslations("error");
  const router = useRouter();

  const [cidErrorMsg, setCIdErrorMsg] = useState<Error>();
  const [cidFetching, setCidFetching] = useState<boolean>(false);
  const [inputCId, setInputCId] = useState<string>("");
  const gotoCId = async (cid: string) => {
    setCIdErrorMsg(undefined);
    setCidFetching(true);
    await fetchBackend()
      .url(`/api/brief/${cid}`)
      .options({
        cache: "no-cache",
      })
      .get()
      .notFound(markAsExpected)
      .res(() => {
        if (isStandalone() || isInsideFrame()) {
          router.push(`/${locale}/edit?cid=${cid}`);
        } else {
          window.open(`/${locale}/edit?cid=${cid}`, "_blank")?.focus(); // これで新しいタブが開かない場合がある
        }
        setCidFetching(false);
        setCIdErrorMsg(undefined);
        setInputCId(cid);
      })
      .catch((e: unknown) => {
        setCidFetching(false);
        setCIdErrorMsg(captureAndWrap(e));
        setInputCId("");
      });
  };

  return (
    <>
      <Input
        className="ml-4 w-20"
        actualValue={inputCId}
        updateValue={gotoCId}
        updateInvalidValue={() => setInputCId("")}
        isValid={(t) => v.safeParse(CidSchema(), t).success}
        left
      />
      {inputCId !== "" && (
        <ExternalLink
          className={clsx("ml-1")}
          // use encodeURIComponent to silence CodeQL false positive alert
          href={`/${locale}/edit?cid=${encodeURIComponent(inputCId)}`}
        >
          {t("newTab")}
        </ExternalLink>
      )}
      <span className={clsx(cidFetching ? "inline-block" : "hidden")}>
        <SlimeSVG />
        Loading...
      </span>
      {cidErrorMsg instanceof Error && (
        <span className="ml-1 inline-block">
          {formatError(cidErrorMsg, te)}
        </span>
      )}
    </>
  );
}

export function SafariLSWarning() {
  const t = useTranslations("main.edit");
  const isSafari = useSafariDetector();
  return (
    isSafari && (
      <p className="mb-1">
        <Caution className="inline-block mr-1 translate-y-0.5 " />
        {t("safariLSWarning")}
      </p>
    )
  );
}
