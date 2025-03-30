"use client";

import Header from "@/common/header.js";
import { Box } from "@/common/box.js";
import Footer, { tabTitleKeys, tabURLs } from "@/common/footer.js";
import { useDisplayMode } from "@/scale.js";
import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Title from "@/common/titleLogo.js";
import { linkStyle1 } from "@/common/linkStyle.js";
import { useTranslations } from "next-intl";
import { RedirectedWarning } from "@/common/redirectedWarning";
import { PWAInstallMain, usePWAInstall } from "@/common/pwaInstall";

interface Props {
  children?: ReactNode | ReactNode[];
  tab: number | undefined;
  locale: string;
  modal?: ReactNode;
}
export function IndexMain(props: Props) {
  const router = useRouter();
  const pwa = usePWAInstall();
  const locale = props.locale;
  const t = useTranslations("main");
  const tabTitles = (i: number) => t(tabTitleKeys[i] + ".title");
  const { screenWidth, rem, isMobileMain } = useDisplayMode();

  const isTitlePage = props.tab === undefined;
  const isHiddenPage = props.tab !== undefined && props.tab >= tabURLs.length;

  const [menuMoveLeft, setMenuMoveLeft] = useState<boolean>(false);
  // const [menuMoveRight, setMenuMoveRight] = useState<boolean>(false);

  return (
    <main className="flex flex-col w-full overflow-x-hidden min-h-dvh h-max">
      {props.modal}
      {props.tab !== undefined && (
        <div className="main-wide:hidden">
          <Header locale={locale}>{tabTitles(props.tab)}</Header>
        </div>
      )}
      <Link
        href={`/${locale}`}
        className={
          (!isTitlePage ? "hidden main-wide:block " : "basis-0 grow-1 ") +
          "shrink-0 basis-24 overflow-hidden relative " +
          linkStyle1
        }
        style={{
          marginLeft: "-20rem",
          marginRight: "-20rem",
        }}
        prefetch={!process.env.NO_PREFETCH}
      >
        <Title className="absolute inset-0 " anim={isTitlePage} />
      </Link>
      <RedirectedWarning
        className={
          "self-center mx-6 " + (!isTitlePage ? "my-2 " : "basis-0 grow-1 ")
        }
      />
      {isTitlePage && <PWAInstallMain pwa={pwa} className="self-center mx-6 my-2 " />}
      <div
        className={
          "main-wide:max-h-dvh main-wide:overflow-hidden main-wide:mb-3 " +
          "shrink-0 basis-56 basis-0 grow-2 " +
          "flex flex-row items-stretch justify-center px-6 "
        }
      >
        {!isHiddenPage && (
          <div
            className={
              (props.tab === undefined ? "flex " : "hidden main-wide:flex ") +
              "flex-col h-max w-60 shrink-0 my-auto " +
              "transition ease-out duration-200 "
            }
            style={{
              transform: menuMoveLeft
                ? `translateX(-${
                    (screenWidth - (56 / 4) * rem - (12 / 4) * rem) / 2
                  }px)`
                : undefined,
            }}
          >
            {tabURLs.map((tabURL, i) =>
              i === props.tab ? (
                <Box
                  key={i}
                  className="text-center rounded-r-none py-3 pl-2 pr-2"
                >
                  {tabTitles(i)}
                </Box>
              ) : (
                <Link
                  key={i}
                  href={`/${locale}${tabURL}`}
                  className={
                    " text-center hover:bg-sky-200 hover:dark:bg-orange-950 active:shadow-inner " +
                    (isTitlePage
                      ? "rounded-lg p-3 "
                      : "rounded-l-lg py-3 pl-2 pr-2 ")
                  }
                  prefetch={!process.env.NO_PREFETCH}
                  onClick={(e) => {
                    if (isTitlePage && !isMobileMain) {
                      setMenuMoveLeft(true);
                      setTimeout(() => {
                        router.replace(`/${locale}${tabURL}`, {
                          scroll: false,
                        });
                      }, 150);
                      e.preventDefault();
                    }
                  }}
                  scroll={false}
                >
                  {tabTitles(i)}
                </Link>
              ),
            )}
          </div>
        )}
        {!isTitlePage && (
          <Box
            className={
              "flex flex-col p-6 overflow-auto " +
              "w-full min-h-0 my-6 main-wide:flex-1 main-wide:my-0 "
            }
          >
            {props.children}
          </Box>
        )}
      </div>
      <Footer
        locale={locale}
        nav={
          isHiddenPage
            ? "block"
            : isTitlePage
              ? false
              : "block main-wide:hidden"
        }
      />
    </main>
  );
}
