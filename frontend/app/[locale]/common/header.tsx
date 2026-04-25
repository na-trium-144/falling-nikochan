"use client";

import clsx from "clsx/lite";
import { ReactNode } from "react";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";
import {
  historyBackWithReview,
  LinkWithReview,
  requestReview,
} from "./pwaInstall.jsx";
import { ButtonHighlight } from "./button.jsx";
import Title, { TitleAsLink } from "./titleLogo.js";
import Link from "next/link.js";
import { pcTabTitleKeys, tabURLs } from "./footer.js";
import { useTranslations } from "next-intl";

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
  return (
    <header
      className={clsx(
        "no-mobile flex flex-row items-center w-full max-w-main",
        props.className
      )}
    >
      <LinkWithReview
        href={`/${props.locale}`}
        className={clsx("fn-link-1", "w-72 h-18 overflow-visible")}
      >
        <Title className="relative h-23 scale-75 origin-top-left" />
      </LinkWithReview>
      {pcTabTitleKeys.map((key, i) => (
        <LinkWithReview
          key={i}
          href={`/${props.locale}${tabURLs[key]}`}
          className={clsx("fn-main-nav-item fn-flat-button fn-sky")}
        >
          {t(key + ".title")}
        </LinkWithReview>
      ))}
    </header>
  );
}
