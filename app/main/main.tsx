"use client";

import Header from "@/common/header";
import { Box } from "@/common/box";
import Footer from "@/common/footer";
import { useDisplayMode } from "@/scale";
import Link from "next/link";
import { ReactNode } from "react";

export const tabTitles = ["Falling Nikochan とは？", "プレイする", "譜面作成"];
export const tabURLs = ["/main/about/1", "/main/play", "/main/edit"];

interface Props {
  children?: ReactNode | ReactNode[];
  tab: number | undefined;
}
export function IndexMain(props: Props) {
  const { screenWidth, screenHeight, rem } = useDisplayMode();

  const isMobile = screenWidth < 40 * rem;
  console.log(isMobile);
  console.log(screenWidth / rem);
  return (
    <main className="flex flex-col w-full min-h-screen h-max">
      {(isMobile && props.tab !== undefined) ?(    
              <Header>{tabTitles[props.tab]}</Header>
) : (
        <div className="flex-none basis-32 flex flex-row items-center justify-center">
          <div className="text-4xl">Falling Nikochan</div>
        </div>
      )}
      <div
        className={
          (props.tab !== undefined ? "basis-96 " : "basis-auto ") +
          (isMobile ? "" : "max-h-screen overflow-hidden mb-3 ") +
          "grow shrink-0 " +
          "flex flex-row justify-center px-6 "
        }
      >
        {!(isMobile && props.tab !== undefined) && (
          <div className="flex flex-col justify-center w-56 shrink-0">
            {tabTitles.map((tabName, i) =>
              i === props.tab ? (
                <Link key={i} href="/">
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
                >
                  {tabName}
                </Link>
              )
            )}
          </div>
        )}
        {props.tab !== undefined && (
          <Box
            className={
              "flex flex-col p-6 overflow-auto " +
              (isMobile ? "w-full my-6 " : "shrink ")
            }
            style={{ flexBasis: isMobile ? undefined : 600 }}
          >
            {props.children}
          </Box>
        )}
      </div>
      <Footer nav={isMobile && props.tab !== undefined}/>
    </main>
  );
}
