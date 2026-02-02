"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx/lite";
import {
  buttonBorderStyle1,
  buttonBorderStyle2,
  ButtonHighlight,
  buttonStyle,
} from "@/common/button";
import FormOne from "@icon-park/react/lib/icons/FormOne";
import { ExternalLink } from "@/common/extLink";
import { XLogo } from "@/common/x";
import Github from "@icon-park/react/lib/icons/Github";
import { Box } from "./box";

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
      <a href="/" className={clsx("inline-block", buttonStyle)}>
        <span className={buttonBorderStyle1} />
        <span className={buttonBorderStyle2} />
        <ButtonHighlight />
        {goHome}
      </a>
    </div>
  );
}

export function LinksOnError() {
  const tl = useTranslations("main.links");

  return (
    <Box classNameOuter="mb-3" padding={3}>
      <h4 className="mb-2 text-lg font-semibold font-title">{tl("title")}</h4>
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
          <ExternalLink href="https://twitter.com/@nikochan144">
            <span className="hidden main-wide:inline">
              {tl("officialAccount")}
            </span>
            <span className="main-wide:hidden">
              {tl("officialAccountShort")}
            </span>
          </ExternalLink>
        </li>
        <li>
          <Github className="inline-block align-middle mr-1" />
          <span className="mr-1">GitHub:</span>
          <ExternalLink href="https://github.com/na-trium-144/falling-nikochan">
            <span className="hidden main-wide:inline">na-trium-144/</span>
            <span>falling-nikochan</span>
          </ExternalLink>
        </li>
      </ul>
    </Box>
  );
}
