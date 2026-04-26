"use client";

import clsx from "clsx/lite";
import { ReactNode, useEffect, useState } from "react";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";
import HamburgerButton from "@icon-park/react/lib/icons/HamburgerButton";
import Comment from "@icon-park/react/lib/icons/Comment";
import {
  historyBackWithReview,
  LinkWithReview,
  requestReview,
} from "./pwaInstall.jsx";
import { ButtonHighlight } from "./button.jsx";
import Title, { TitleAsLink } from "./titleLogo.js";
import Link from "next/link.js";
import { useTranslations } from "next-intl";
import { lastVisitedOld } from "./version.js";
import { ChangeLogPopup } from "./changeLog.js";
import { useDelayedDisplayState } from "./delayedDisplayState.js";
import { Box } from "./box.js";
import { MenuLangSwitcher } from "./langSwitcher.js";
import { MenuThemeSwitcher } from "./theme.js";

const pcTabTitleKeys = ["play", "edit", "policies", "links"] as const;
const tabURLs = {
  play: "/main/play",
  edit: "/main/edit",
  policies: "/main/policies",
  links: "/main/links",
} as const;

interface MProps {
  className?: string;
  children: ReactNode | ReactNode[];
  noBackButton?: boolean;
}
export function MobileHeader(props: MProps) {
  return (
    <header className={clsx("fn-mobile-header no-pc", props.className)}>
      {!props.noBackButton && (
        <button
          className="fn-back fn-icon-button h-max m-auto"
          onClick={() => {
            historyBackWithReview();
          }}
        >
          <ButtonHighlight />
          <ArrowLeft className="inline-block w-max align-middle m-auto " />
        </button>
      )}
      <span className="fn-heading-sect">{props.children}</span>
    </header>
  );
}

interface Props {
  className?: string;
  locale: string;
}
export function PCHeader(props: Props) {
  const t = useTranslations("main");
  const [showChangeLog, setShowChangeLog] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isLastVisitedOld, setIsLastVisitedOld] = useState<boolean>(false);
  useEffect(() => setIsLastVisitedOld(lastVisitedOld()), []);
  return (
    <header
      className={clsx(
        "no-mobile flex flex-row items-center w-full",
        "pr-6 h-16 gap-3",
        props.className
      )}
    >
      <LinkWithReview
        href={`/${props.locale}`}
        className="fn-link-1 w-72 h-full overflow-visible"
      >
        <Title className="relative h-22 scale-75 origin-top-left" />
      </LinkWithReview>
      <nav className="flex-none flex flex-row gap-3 text-lg">
        {pcTabTitleKeys.map((key, i) => (
          <LinkWithReview
            key={i}
            href={`/${props.locale}${tabURLs[key]}`}
            className="fn-link-1"
          >
            {t(key + ".titleShort")}
          </LinkWithReview>
        ))}
      </nav>
      <div className="flex-1" />
      <div className="relative min-w-0 flex justify-end">
        {/* バージョン表記が長い場合、メニューに入れたりするのは面倒なので雑に左のnavに被らせる
        productionでは短い表記なので被ることはないはず... */}
        <button
          className={clsx("flex-none inline-block relative", "fn-link-1")}
          onClick={() => {
            setShowChangeLog(!showChangeLog);
          }}
        >
          <span>ver.</span>
          <span className="ml-1 mr-0.5">{process.env.buildVersion}</span>
          <Comment className="inline-block align-middle" />
          {isLastVisitedOld && (
            <span
              className={clsx("absolute w-3 h-3 rounded-full bg-red-500")}
              style={{ top: "-0.1rem", right: "-0.25rem" }}
            />
          )}
        </button>
        <ChangeLogPopup
          locale={props.locale}
          open={showChangeLog}
          onClose={() => setShowChangeLog(false)}
        />
      </div>
      <div className="relative">
        <button
          className="fn-flat-button fn-sky rounded-lg p-1"
          onClick={() => setShowMenu(!showMenu)}
        >
          <span className="fn-glass-1" />
          <span className="fn-glass-2" />
          <ButtonHighlight />
          <HamburgerButton className="text-2xl" />
        </button>
        <PCMenuPopup
          locale={props.locale}
          open={showMenu}
          onClose={() => setShowMenu(false)}
        />
      </div>
    </header>
  );
}

interface PopupProps {
  locale: string;
  open: boolean;
  onClose: () => void;
}
export function PCMenuPopup(props: PopupProps) {
  const [popupOpened, popupAppearing, setPopupOpened] =
    useDelayedDisplayState(200);
  useEffect(() => {
    setPopupOpened(props.open);
  }, [props.open, setPopupOpened]);
  return (
    popupOpened && (
      <>
        <div
          className={clsx("fixed z-changelog-bg inset-0")}
          onClick={(e) => {
            props.onClose();
            e.stopPropagation();
          }}
        />
        <div
          className={clsx("absolute top-full mt-1 right-0 w-max z-changelog")}
        >
          <Box
            classNameOuter={clsx(
              "z-changelog",
              "w-max h-max origin-[calc(100%-2rem)_0]",
              "shadow-modal",
              "transition-all duration-200",
              popupAppearing
                ? "ease-in scale-100 opacity-100"
                : "ease-out scale-0 opacity-0"
            )}
            classNameInner="p-4 text-left space-y-2"
          >
            <MenuLangSwitcher locale={props.locale} />
            <MenuThemeSwitcher />
          </Box>
        </div>
      </>
    )
  );
}
