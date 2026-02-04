"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx/lite";
import { ButtonHighlight } from "@/common/button";
import FormOne from "@icon-park/react/lib/icons/FormOne";
import { ExternalLink } from "@/common/extLink";
import { XLogo } from "@/common/x";
import Github from "@icon-park/react/lib/icons/Github";
import { Box } from "./box";
import { useEffect, useState } from "react";

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
        <span className="fn-glass-1" />
        <span className="fn-glass-2" />
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
      <h4 className="fn-heading-box">{tl("title")}</h4>
      <ul className="list-disc ml-6 space-y-1 text-left">
        {/* TODO: links/clientPage.tsx と共通化 */}
        <li>
          <FormOne className="inline-block align-middle mr-1" />
          <ExternalLink href="https://forms.gle/3PVFRA7nUtXSHb8TA">
            {tl("contactForm")}
          </ExternalLink>
        </li>
        <li>
          <XLogo className="mr-1" />
          <ExternalLink href="https://twitter.com/nikochan144">
            <span className="no-mobile">{tl("officialAccount")}</span>
            <span className="no-pc">{tl("officialAccountShort")}</span>
          </ExternalLink>
        </li>
        <li>
          <Github className="inline-block align-middle mr-1" />
          <span className="mr-1">GitHub:</span>
          <ExternalLink href="https://github.com/na-trium-144/falling-nikochan">
            <span className="no-mobile">na-trium-144/</span>
            <span>falling-nikochan</span>
          </ExternalLink>
        </li>
      </ul>
    </Box>
  );
}

export function ErrorMessage({ error }: { error: unknown }) {
  if (error) {
    return (
      <pre
        className={clsx(
          "mb-3",
          "p-2 rounded-md",
          "text-xs",
          "bg-sky-200/25 dark:bg-orange-800/10",
          "whitespace-pre-wrap"
        )}
      >
        {String(error)}
      </pre>
    );
  } else {
    return <div>See the browser console for more information.</div>;
  }
}
