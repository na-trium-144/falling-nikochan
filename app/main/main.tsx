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

  const [menuMoveLeft, setMenuMoveLeft] = useState<boolean>(false);
  // const [menuMoveRight, setMenuMoveRight] = useState<boolean>(false);

  return (
    <main className="flex flex-col w-screen overflow-x-hidden min-h-screen h-max">
      {props.tab !== undefined && (
        <div className="main-wide:hidden">
          <Header>{tabTitles[props.tab]}</Header>
        </div>
      )}
      <Link
        href="/"
        className={
          (!isTitlePage ? "hidden main-wide:block " : "") +
          "shrink-0 basis-24 overflow-hidden " +
          linkStyle1
        }
        style={{
          flexGrow: !isTitlePage ? 0 : 0.5,
          marginLeft: "-20rem",
          marginRight: "-20rem",
        }}
      >
        <Title anim={isTitlePage} />
      </Link>
      <div
        className={
          "main-wide:max-h-screen main-wide:overflow-hidden main-wide:mb-3 " +
          "shrink-0 basis-56 grow " +
          "flex flex-row items-stretch justify-center px-6 "
        }
      >
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
          {tabTitles.map((tabName, i) =>
            i === props.tab ? (
              <Box
                key={i}
                className="text-center rounded-r-none py-3 pl-2 pr-2"
              >
                {tabName}
              </Box>
            ) : (
              <Link
                key={i}
                href={tabURLs[i]}
                className={
                  " text-center hover:bg-sky-200 active:shadow-inner " +
                  (isTitlePage
                    ? "rounded-lg p-3 "
                    : "rounded-l-lg py-3 pl-2 pr-2 ")
                }
                onClick={(e) => {
                  if (isTitlePage && !isMobile) {
                    setMenuMoveLeft(true);
                    setTimeout(() => {
                      router.replace(tabURLs[i], { scroll: false });
                    }, 150);
                    e.preventDefault();
                  }
                }}
                scroll={false}
              >
                {tabName}
              </Link>
            )
          )}
        </div>
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
        nav={props.tab !== undefined ? "block main-wide:hidden" : false}
      />
    </main>
  );
}
