"use client";

import clsx from "clsx/lite";
import { MobileHeader } from "@/common/header.js";
import { Box } from "@/common/box.js";
import {
  MobileFooter,
  PCFooter,
  pcTabTitleKeys,
  TabKeys,
  tabURLs,
} from "@/common/footer.js";
import { ReactNode, RefObject, useCallback, useState } from "react";
import Link from "next/link";
import { TitleAsLink } from "@/common/titleLogo.js";
import { linkStyle1, linkStyle3 } from "@/common/linkStyle.js";
import { useTranslations } from "next-intl";
import { RedirectedWarning } from "@/common/redirectedWarning";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";
import { historyBackWithReview, LinkWithReview } from "@/common/pwaInstall";
import ArrowRight from "@icon-park/react/lib/icons/ArrowRight";
import { useDelayedDisplayState } from "@/common/delayedDisplayState";
import { AboutModal } from "@/common/aboutModal";
import { ButtonHighlight } from "@/common/button";
import {
  boxButtonBorderStyle1,
  boxButtonBorderStyle2,
  boxButtonStyle,
  skyFlatButtonBorderStyle1,
  skyFlatButtonBorderStyle2,
  skyFlatButtonStyle,
} from "@/common/flatButton";

interface Props {
  children?: ReactNode | ReactNode[];
  title: string;
  tabKey: TabKeys; // PC表示でnav内のアクティブなタブ or nullでnavを非表示
  mobileTabKey: TabKeys; // モバイル表示でfooter内のアクティブなタブ
  noBackButtonMobile?: boolean; // モバイル表示で戻るボタンを非表示 (footerから直接開けるページの場合非表示にする)
  noBackButtonPC?: boolean;
  locale: string;
  boxRef?: RefObject<HTMLDivElement | null>;
}
export function IndexMain(props: Props) {
  const locale = props.locale;
  const t = useTranslations("main");

  const [aboutPageIndex, setAboutPageIndex_] = useState<number | null>(null);
  const [aboutOpen, aboutAnim, setAboutOpen_] = useDelayedDisplayState(200);
  const setAboutPageIndex = useCallback(
    (i: number | null) => {
      setAboutOpen_(i !== null, () => setAboutPageIndex_(i));
    },
    [setAboutOpen_]
  );

  return (
    <main className="flex flex-col w-full h-full items-center ">
      {aboutPageIndex !== null && aboutOpen ? (
        <AboutModal
          aboutAnim={aboutAnim}
          aboutPageIndex={aboutPageIndex}
          setAboutPageIndex={setAboutPageIndex}
          locale={props.locale}
        />
      ) : null}
      <MobileHeader noBackButton={props.noBackButtonMobile}>
        {props.title}
      </MobileHeader>
      <TitleAsLink
        className="hidden main-wide:block shrink-0"
        locale={locale}
      />
      <AboutDescription
        className="my-2 hidden main-wide:block"
        locale={locale}
        onClickAbout={() => setAboutPageIndex(1)}
      />
      <RedirectedWarning />
      <div
        className={clsx(
          "w-full overflow-hidden",
          "shrink-0 basis-0 grow-2",
          "flex flex-row items-stretch justify-center px-3 main-wide:px-6"
        )}
      >
        {props.tabKey !== null && (
          <nav
            className={clsx(
              "hidden main-wide:flex",
              "flex-col h-max w-main-nav shrink-0 my-auto",
              "transition ease-out duration-200"
            )}
          >
            {pcTabTitleKeys.map((key, i) =>
              key === props.tabKey ? (
                <LinkWithReview
                  key={i}
                  href={`/${locale}${tabURLs[key]}`}
                  className={clsx(
                    "rounded-l-2xl py-3 pl-2 pr-2 text-center",
                    boxButtonStyle
                  )}
                >
                  <span className={clsx(boxButtonBorderStyle1, "border-r-0")} />
                  <span className={clsx(boxButtonBorderStyle2, "border-r-0")} />
                  <ButtonHighlight />
                  {t(key + ".title")}
                </LinkWithReview>
              ) : (
                <LinkWithReview
                  key={i}
                  href={`/${locale}${tabURLs[key]}`}
                  className={clsx(
                    "rounded-l-2xl py-3 pl-2 pr-2 text-center",
                    skyFlatButtonStyle
                  )}
                >
                  <span
                    className={clsx(skyFlatButtonBorderStyle1, "border-r-0")}
                  />
                  <span
                    className={clsx(skyFlatButtonBorderStyle2, "border-r-0")}
                  />
                  <ButtonHighlight />
                  {t(key + ".title")}
                </LinkWithReview>
              )
            )}
          </nav>
        )}
        <Box
          refInner={props.boxRef}
          classNameOuter={clsx("min-h-0 basis-main shrink-1 min-w-0")}
          classNameInner={clsx("flex flex-col")}
          scrollableY
          padding={6}
        >
          {!props.noBackButtonPC && (
            <button
              className={clsx("hidden main-wide:block w-max mb-3", linkStyle1)}
              onClick={() => {
                historyBackWithReview();
              }}
            >
              <ArrowLeft className="inline-block align-middle mr-2 " />
              {t("back")}
            </button>
          )}
          {props.children}
        </Box>
      </div>
      <PCFooter locale={locale} nav={props.tabKey === null} />
      <MobileFooter locale={locale} tabKey={props.mobileTabKey} />
    </main>
  );
}

export function AboutDescription(props: {
  className: string;
  locale: string;
  onClickAbout: () => void;
}) {
  const t = useTranslations("main");
  return (
    <div className={clsx("flex-none text-center px-6", props.className)}>
      {t("description")}
      <Link
        href={`/${props.locale}/main/about/1`}
        className={clsx("main-wide:hidden inline-block", "ml-2", linkStyle3)}
      >
        {t("aboutNikochan")}
        <ArrowRight
          className="inline-block align-middle ml-2 "
          theme="filled"
        />
      </Link>
      <button
        className={clsx("hidden main-wide:inline-block", "ml-2", linkStyle3)}
        onClick={props.onClickAbout}
      >
        {t("aboutNikochan")}
        <ArrowRight
          className="inline-block align-middle ml-2 "
          theme="filled"
        />
      </button>
    </div>
  );
}
