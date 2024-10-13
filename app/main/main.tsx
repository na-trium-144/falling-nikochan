"use client";

import Header from "@/common/header";
import { Box } from "@/common/box";
import Footer from "@/common/footer";
import { useDisplayMode } from "@/scale";
import Link from "next/link";
import { ReactNode } from "react";
import { tabTitles, tabURLs } from "./const";

interface Props {
  children?: ReactNode | ReactNode[];
  tab: number | undefined;
}
export function IndexMain(props: Props) {
  const { screenWidth, rem } = useDisplayMode();

  const isMobile = screenWidth < 40 * rem;
  return (
    <main className="flex flex-col w-full min-h-screen h-max">
      {props.tab !== undefined && (
        <div className="main-wide:hidden">
          <Header>{tabTitles[props.tab]}</Header>
        </div>
      )}
      <div
        className={
          (props.tab !== undefined ? "hidden main-wide:flex " : "flex ") +
          "flex-none basis-32 flex-row items-center justify-center"
        }
      >
        <div className="text-4xl">Falling Nikochan</div>
      </div>
      <div
        className={
          (props.tab !== undefined ? "basis-96 " : "basis-auto ") +
          "main-wide:max-h-screen main-wide:overflow-hidden main-wide:mb-3 " +
          "grow shrink-0 " +
          "flex flex-row justify-center px-6 "
        }
      >
        <div
          className={
            (props.tab === undefined ? "flex " : "hidden main-wide:flex ") +
            "flex-col justify-center w-56 shrink-0 "
          }
        >
          {tabTitles.map((tabName, i) =>
            i === props.tab ? (
              <Link key={i} href="/" scroll={false} replace={!isMobile}>
                <Box className="text-center rounded-r-none py-3 pl-2 pr-2">
                  {tabName}
                </Box>
              </Link>
            ) : (
              <Link
                key={i}
                className={
                  " text-center hover:bg-sky-200 " +
                  (props.tab !== undefined
                    ? "rounded-l-lg py-3 pl-2 pr-2"
                    : "rounded-lg p-3")
                }
                href={tabURLs[i]}
                scroll={false}
                replace={!isMobile}
              >
                {tabName}
              </Link>
            )
          )}
        </div>
        {props.tab !== undefined && (
          <Box
            className={
              "flex flex-col p-6 overflow-auto " +
              (isMobile ? "w-full my-6 " : "flex-1 ")
            }
          >
            {props.children}
          </Box>
        )}
      </div>
      <Footer nav={isMobile && props.tab !== undefined} />
    </main>
  );
}
