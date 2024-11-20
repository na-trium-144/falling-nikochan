"use client";

import Header from "@/common/header";
import { Box } from "@/common/box";
import Footer from "@/common/footer";
import { useDisplayMode } from "@/scale";
import { ReactNode, useState } from "react";
import { tabTitles, tabURLs } from "./const";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Title from "@/common/titleLogo";
import { linkStyle1 } from "@/common/linkStyle";

interface Props {
  children?: ReactNode | ReactNode[];
  tab: number | undefined;
}
export function IndexMain(props: Props) {
  const router = useRouter();
  const { screenWidth, rem } = useDisplayMode();

  const isMobile = screenWidth < 40 * rem;
  const isTitlePage = props.tab === undefined;
  const isHiddenPage = props.tab !== undefined && props.tab >= tabURLs.length;

  const [menuMoveLeft, setMenuMoveLeft] = useState<boolean>(false);
  // const [menuMoveRight, setMenuMoveRight] = useState<boolean>(false);

  return (
    <main className="flex flex-col w-screen overflow-x-hidden min-h-dvh h-max">
      {props.tab !== undefined && (
        <div className="main-wide:hidden">
          <Header>{tabTitles[props.tab]}</Header>
        </div>
      )}
      <Link
        href="/"
        className={
          (!isTitlePage ? "hidden main-wide:block " : " ") +
          "shrink-0 basis-24 overflow-hidden relative " +
          linkStyle1
        }
        style={{
          flexGrow: !isTitlePage ? 0 : 0.5,
          marginLeft: "-20rem",
          marginRight: "-20rem",
        }}
        prefetch={false}
      >
        <Title className="absolute inset-0 " anim={isTitlePage} />
      </Link>
      <div
        className={
          "main-wide:max-h-dvh main-wide:overflow-hidden main-wide:mb-3 " +
          "shrink-0 basis-56 grow " +
          "flex flex-row items-stretch justify-center px-6 "
        }
      >
        {!isHiddenPage && (
          <div
            className={
              (props.tab === undefined ? "flex " : "hidden main-wide:flex ") +
              "flex-col h-max w-56 shrink-0 my-auto " +
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
                  {tabTitles[i]}
                </Box>
              ) : (
                <Link
                  key={i}
                  href={tabURL}
                  className={
                    " text-center hover:bg-sky-200 hover:dark:bg-orange-950 active:shadow-inner " +
                    (isTitlePage
                      ? "rounded-lg p-3 "
                      : "rounded-l-lg py-3 pl-2 pr-2 ")
                  }
                  prefetch={false}
                  onClick={(e) => {
                    if (isTitlePage && !isMobile) {
                      setMenuMoveLeft(true);
                      setTimeout(() => {
                        router.replace(tabURL, { scroll: false });
                      }, 150);
                      e.preventDefault();
                    }
                  }}
                  scroll={false}
                >
                  {tabTitles[i]}
                </Link>
              )
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
