"use client";

import clsx from "clsx/lite";
import { ReactNode, useEffect, useState } from "react";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";
import HamburgerButton from "@icon-park/react/lib/icons/HamburgerButton";
import Comment from "@icon-park/react/lib/icons/Comment";
import { historyBackWithReview, LinkWithReview } from "./pwaInstall.jsx";
import { ButtonHighlight } from "./button.jsx";
import Title from "./titleLogo.js";
import { useTranslations } from "next-intl";
import { LastVisitedIndicator } from "./version.js";
import { ChangeLogPopup } from "./changeLog.js";
import { useDelayedDisplayState } from "./delayedDisplayState.js";
import { Box } from "./box.js";
import { MenuLangSwitcher } from "./langSwitcher.js";
import { MenuThemeSwitcher } from "./theme.js";
import {
  APIDocsLink,
  ContactFormLink,
  DevPageLink,
  GitHubLink,
  XLink,
} from "./contactLinks.js";
import { OpenDevCounter } from "./counter.js";

const pcTabTitleKeys = ["play", "edit"] as const;
const tabURLs = {
  play: "/main/play",
  edit: "/main/edit",
} as const;

interface MProps {
  className?: string;
  children: ReactNode | ReactNode[];
  noBackButton?: boolean;
}
export function MobileHeader(props: MProps) {
  return (
    <header
      className={clsx(
        "fn-mobile-header",
        // "no-pc",
        props.className
      )}
    >
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
  return (
    <header className={clsx("no-mobile fn-pc-header", props.className)}>
      <LinkWithReview
        href={`/${props.locale}`}
        className="fn-link-1 w-72 h-full overflow-visible"
      >
        <Title className="relative h-22 scale-75 origin-top-left" />
      </LinkWithReview>
      <nav>
        {pcTabTitleKeys.map((key, i) => (
          <LinkWithReview
            key={i}
            href={`/${props.locale}${tabURLs[key]}`}
            className="fn-link-1"
          >
            {t(key + ".titleHeader")}
          </LinkWithReview>
        ))}
      </nav>
    </header>
  );
}
interface Props2 {
  className?: string;
  locale: string;
  backdropBlur?: boolean;
  changeLog: ReactNode;
}
export function PCHeader2(props: Props2) {
  const [showChangeLog, setShowChangeLog] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  return (
    <aside className={clsx("no-mobile fn-pc-header2", props.className)}>
      {props.backdropBlur && (
        // 親要素自体にbackdrop-blurクラスを追加すると、changelogPopupやmenuがその中でbackdrop-blurを使えなくなってしまうので、別要素にしている
        <div className="absolute inset-0 backdrop-blur-xs rounded-bl-sq-2xl" />
      )}
      <div className="relative">
        <button
          className={clsx("inline-block relative", "fn-link-1")}
          onClick={() => {
            setShowChangeLog(!showChangeLog);
          }}
        >
          <span>ver.</span>
          <span className="ml-1 mr-0.5">{process.env.buildVersion}</span>
          <Comment className="inline-block align-middle" />
          <LastVisitedIndicator style={{ top: "-0.1rem", right: "-0.25rem" }} />
        </button>
        <ChangeLogPopup
          locale={props.locale}
          open={showChangeLog}
          onClose={() => setShowChangeLog(false)}
          changeLog={props.changeLog}
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
    </aside>
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
        <OpenDevCounter
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
            <hr className="fn-hr my-4" />
            <ul className="list-disc ml-4.5 space-y-1 text-left">
              <li>
                <ContactFormLink />
              </li>
              <li>
                <XLink small />
              </li>
              <li>
                <GitHubLink small />
              </li>
            </ul>
            <hr className="fn-hr my-4" />
            <ul className="list-disc ml-4.5 space-y-1 text-left">
              <li>
                <APIDocsLink small />
              </li>
              <li className="fn-counter-hidden">
                <DevPageLink locale={props.locale} />
              </li>
            </ul>
          </Box>
        </OpenDevCounter>
      </>
    )
  );
}

export function MainBackButton() {
  const t = useTranslations("main");
  return (
    <button
      className={clsx("no-mobile w-max mb-3 mr-3 fn-link-1 space-x-2")}
      onClick={() => {
        historyBackWithReview();
      }}
    >
      <ArrowLeft className="inline-block align-middle" />
      <span>{t("back")}</span>
    </button>
  );
}
