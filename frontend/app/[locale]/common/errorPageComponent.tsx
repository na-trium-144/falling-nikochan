"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx/lite";
import { ButtonHighlight } from "@/common/button";
import { Box, WarningBox } from "./box";
import { useEffect, useState } from "react";
import { ContactFormLink, GitHubLink, XLink } from "@/clientPage";

// IntlProvider内の場合はuseTranslationsで取得する。
// IntlProvider外で使う場合はサーバーサイドでerror.errorPage.goHomeに相当するメッセージを取得してpropsに渡す。
export function GoHomeButton({ goHome }: { goHome?: string }) {
  if (!goHome) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const t = useTranslations("error.errorPage");
    goHome = t("goHome");
  }

  return (
    <div>
      <a href="/" className="inline-block fn-button">
        <fn-glass-1 />
        <fn-glass-2 />
        <ButtonHighlight />
        {goHome}
      </a>
    </div>
  );
}

export function LinksOnError({ dependOnStatus }: { dependOnStatus?: string }) {
  const tl = useTranslations("main.links");
  const [isServerSideError, setIsServerSideError] = useState(false);

  useEffect(() => {
    setIsServerSideError(
      Number(dependOnStatus) === 403 || Number(dependOnStatus) >= 500
    );
  }, [dependOnStatus]);

  if (dependOnStatus !== undefined && !isServerSideError) {
    return null;
  }

  return (
    <Box classNameOuter="mb-3" padding={3}>
      <h4 className="fn-heading-box">{tl("contactLinks")}</h4>
      <ul className="list-disc ml-6 space-y-1 text-left">
        <li>
          <ContactFormLink />
        </li>
        <li>
          <XLink />
        </li>
        <li>
          <GitHubLink />
        </li>
      </ul>
    </Box>
  );
}

export function ErrorMessage({
  error,
  eventId,
}: {
  error: unknown;
  eventId?: string;
}) {
  let t: ReturnType<typeof useTranslations> | null = null;
  try {
    // global-errorやnot-foundなどNextIntlが初期化されていない環境では使えない
    // eslint-disable-next-line react-hooks/rules-of-hooks
    t = useTranslations("error.errorPage");
  } catch {
    // pass
  }
  if (error) {
    return (
      <>
        <pre
          className={clsx(
            "relative fn-sky fn-pre",
            "mb-3 p-2 rounded-sq-xl text-xs",
            "whitespace-pre-wrap"
          )}
        >
          <fn-glass-1 />
          <fn-glass-2 />
          {String(error)}
          {eventId && <div className="text-dim mt-1">EventID={eventId}</div>}
        </pre>
        {t &&
          error instanceof DOMException &&
          error.name === "NotFoundError" && (
            <WarningBox classNameOuter="mb-3">
              {t("disableTranslation")}
            </WarningBox>
          )}
      </>
    );
  } else {
    return <div>See the browser console for more information.</div>;
  }
}
