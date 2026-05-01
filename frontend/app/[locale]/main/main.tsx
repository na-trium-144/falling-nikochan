"use client";

import clsx from "clsx/lite";
import { MobileHeader, PCHeader } from "@/common/header.js";
import { Box } from "@/common/box.js";
import { MobileFooter, PCFooter, TabKeys } from "@/common/footer.js";
import { ReactNode, RefObject, useCallback, useState } from "react";
import Link from "next/link";
import { TitleAsLink } from "@/common/titleLogo.js";
import { useTranslations } from "next-intl";
import { RedirectedWarning } from "@/common/redirectedWarning";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";
import { historyBackWithReview, LinkWithReview } from "@/common/pwaInstall";
import ArrowRight from "@icon-park/react/lib/icons/ArrowRight";
import { useDelayedDisplayState } from "@/common/delayedDisplayState";
import { AboutModal } from "@/common/aboutModal";
import { ButtonHighlight } from "@/common/button";

interface Props {
  classNameInner?: string;
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

  return (
    <main className="flex flex-col w-full h-full items-center ">
      <MobileHeader noBackButton={props.noBackButtonMobile}>
        {props.title}
      </MobileHeader>
      <PCHeader locale={locale} />
      <RedirectedWarning />
      <div
        className={clsx(
          "w-full overflow-hidden",
          "shrink-0 basis-0 grow-2",
          "flex flex-row items-stretch justify-center",
          "px-3 main-wide:px-6 main-wide:pb-6"
        )}
      >
        <Box
          refInner={props.boxRef}
          classNameOuter={clsx("min-h-0 basis-main shrink-1 min-w-0")}
          classNameInner={clsx("flex flex-col", props.classNameInner)}
          scrollableY
          defaultFadeY
          padding={6}
        >
          {!props.noBackButtonPC && (
            <button
              className={clsx("no-mobile w-max mb-3 fn-link-1")}
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
    <div className={clsx("flex-none text-center", props.className)}>
      {t("description")}
      <Link
        href={`/${props.locale}/main/about/1`}
        className={clsx("no-pc inline-block", "ml-2", "fn-link-3")}
      >
        {t("aboutNikochan")}
        <ArrowRight
          className="inline-block align-middle ml-2 "
          theme="filled"
        />
      </Link>
      <button
        className={clsx("no-mobile inline-block", "ml-2", "fn-link-3")}
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
