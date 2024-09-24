"use client";

import BackButton from "@/common/backButton";
import { Box } from "@/common/box";
import { useDisplayMode } from "@/scale";
import Link from "next/link";
import { ReactNode } from "react";

interface Props {
  children?: ReactNode | ReactNode[];
  tab: number | undefined;
}
export function IndexMain(props: Props) {
  const { isMobile, scaledSize } = useDisplayMode();
  const tabTitles = ["Falling Nikochan とは?", "プレイする", "譜面作成"];

  return (
    <main className="flex flex-col" style={{ ...scaledSize }}>
      {!(isMobile && props.tab !== undefined) && (
        <div className="basis-1/4 flex flex-row items-center justify-center">
          <div className="text-4xl">Falling Nikochan</div>
        </div>
      )}
      <div
        className={
          "flex flex-1 flex-row justify-center " + (isMobile ? "p-6 " : "p-3 ")
        }
      >
        {!(isMobile && props.tab !== undefined) && (
          <div className="flex flex-col mt-3 justify-center">
            {tabTitles.map((tabName, i) =>
              i === props.tab ? (
                <Link key={i} href="/">
                  <Box className="text-center rounded-r-none py-3 pl-2 pr-1">
                    {tabName}
                  </Box>
                </Link>
              ) : (
                <Link
                  key={i}
                  className={
                    " text-center hover:bg-sky-200 " +
                    (props.tab !== undefined
                      ? "rounded-l-lg py-3 pl-2 pr-1"
                      : "rounded-lg p-3")
                  }
                  href={["/main/about", "/main/play", "/main/edit"][i]}
                >
                  {tabName}
                </Link>
              )
            )}
          </div>
        )}
        {props.tab !== undefined && (
          <Box className={"flex-1 " + (isMobile ? "p-6 " : "p-3 ")}>
            {isMobile && (
              <BackButton href="/">{tabTitles[props.tab]}</BackButton>
            )}
            {props.children}
          </Box>
        )}
      </div>
    </main>
  );
}
