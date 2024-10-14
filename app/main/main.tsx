"use client";

import Header from "@/common/header";
import { Box } from "@/common/box";
import Footer from "@/common/footer";
import { useDisplayMode } from "@/scale";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { tabTitles, tabURLs } from "./const";
import { useRouter } from "next/navigation";

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
  const [menuMoveRight, setMenuMoveRight] = useState<boolean>(false);

  return (
    <main className="flex flex-col w-full min-h-screen h-max">
      {props.tab !== undefined && (
        <div className="main-wide:hidden">
          <Header>{tabTitles[props.tab]}</Header>
        </div>
      )}
      <div
        className={
          (!isTitlePage ? "hidden main-wide:flex " : "flex ") +
          "flex-none basis-32 flex-row items-center justify-center"
        }
      >
        <div className="text-4xl">Falling Nikochan</div>
      </div>
      <div
        className={
          "basis-0 " +
          "main-wide:max-h-screen main-wide:overflow-hidden main-wide:mb-3 " +
          "grow shrink-0 " +
          "flex flex-row justify-center px-6 "
        }
      >
        <div
          className={
            (props.tab === undefined ? "flex " : "hidden main-wide:flex ") +
            "flex-col justify-center w-56 shrink-0 " +
            "transition ease-out duration-200 "
          }
          style={{
            transform: menuMoveRight
              ? `translateX(${
                  (screenWidth - (56 / 4) * rem - (12 / 4) * rem) / 2
                }px)`
              : menuMoveLeft
              ? `translateX(-${
                  (screenWidth - (56 / 4) * rem - (12 / 4) * rem) / 2
                }px)`
              : undefined,
          }}
        >
          {tabTitles.map((tabName, i) =>
            i === props.tab && !menuMoveRight ? (
              <button
                key={i}
                onClick={() => {
                  if (!isMobile) {
                    setMenuMoveRight(true);
                    setTimeout(() => {
                      router.replace("/", { scroll: false });
                    }, 150);
                  } else {
                    router.push("/", { scroll: false });
                  }
                }}
              >
                <Box className="text-center rounded-r-none py-3 pl-2 pr-2">
                  {tabName}
                </Box>
              </button>
            ) : (
              <button
                key={i}
                className={
                  " text-center hover:bg-sky-200 " +
                  (isTitlePage
                    ? "rounded-lg p-3 "
                    : "rounded-l-lg py-3 pl-2 pr-2 ")
                }
                onClick={() => {
                  if (isTitlePage && !isMobile) {
                    setMenuMoveLeft(true);
                    setTimeout(() => {
                      router.replace(tabURLs[i], { scroll: false });
                    }, 150);
                  } else {
                    router.push(tabURLs[i], { scroll: false });
                  }
                }}
              >
                {tabName}
              </button>
            )
          )}
        </div>
        {!isTitlePage && (
          <Box
            className={
              "flex flex-col p-6 overflow-auto " +
              "w-full my-6 main-wide:flex-1 main-wide:my-0 " +
              (menuMoveRight ? "opacity-0 " : "")
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
