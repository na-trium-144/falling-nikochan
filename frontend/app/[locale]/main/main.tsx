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
import Title from "@/common/titleLogo.js";
import { linkStyle1, linkStyle3 } from "@/common/linkStyle.js";
import { useTranslations } from "next-intl";
import { RedirectedWarning } from "@/common/redirectedWarning";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";
import { historyBackWithReview, LinkWithReview } from "@/common/pwaInstall";
import ArrowRight from "@icon-park/react/lib/icons/ArrowRight";
import { useDelayedDisplayState } from "@/common/delayedDisplayState";
import { AboutModal } from "@/common/aboutModal";

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
      <Link
        href={`/${locale}`}
        className={clsx(
          "hidden main-wide:block w-full",
          "shrink-0 basis-24 relative",
          linkStyle1
        )}
        style={{
          marginLeft: "-20rem",
          marginRight: "-20rem",
        }}
        prefetch={!process.env.NO_PREFETCH}
      >
        <Title className="absolute inset-0 " />
      </Link>
      <div className="my-2 text-center px-6 hidden main-wide:block">
        {t("description")}
        <button
          className={clsx("hidden main-wide:inline-block", "ml-2", linkStyle3)}
          onClick={() => setAboutPageIndex(1)}
        >
          {t("aboutNikochan")}
          <ArrowRight
            className="inline-block align-middle ml-2 "
            theme="filled"
          />
        </button>
      </div>
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
              "flex-col h-max w-64 shrink-0 my-auto",
              "transition ease-out duration-200"
            )}
          >
            {pcTabTitleKeys.map((key, i) =>
              key === props.tabKey ? (
                <LinkWithReview
                  key={i}
                  href={`/${locale}${tabURLs[key]}`}
                  className={clsx(
                    "rounded-lg bg-white/75 dark:bg-stone-800/75 backdrop-blur-2xs",
                    "text-center rounded-r-none py-3 pl-2 pr-2",
                    "hover:bg-white hover:dark:bg-stone-800 active:shadow-inner"
                  )}
                >
                  {t(key + ".title")}
                </LinkWithReview>
              ) : (
                <LinkWithReview
                  key={i}
                  href={`/${locale}${tabURLs[key]}`}
                  className={clsx(
                    " text-center hover:bg-sky-200 hover:dark:bg-orange-950 active:shadow-inner",
                    "rounded-l-lg py-3 pl-2 pr-2"
                  )}
                >
                  {t(key + ".title")}
                </LinkWithReview>
              )
            )}
          </nav>
        )}
        <Box
          refInner={props.boxRef}
          classNameOuter={clsx("min-h-0 flex-1 min-w-0")}
          classNameInner={clsx("flex flex-col p-6 overflow-y-auto")}
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
