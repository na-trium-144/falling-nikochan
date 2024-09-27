"use client";

import { tabTitles, tabURLs } from "@/main/main";
import { useDisplayMode } from "@/scale";
import { Github } from "@icon-park/react";
import Link from "next/link";

interface Props {
  nav?: boolean;
}
export default function Footer(props: Props) {
  const { screenWidth, screenHeight, rem } = useDisplayMode();
  return (
    <footer className="">
      {props.nav && (
        <div
          className={
            "text-center mb-3 divide-solid divide-black " +
            (screenWidth >= 25 * rem
              ? "divide-x "
              : "flex flex-col items-stretch w-max mx-auto")
          }
        >
          {tabTitles.map((tabName, i) => (
            <Link
              key={i}
              className="px-2 hover:text-slate-500 "
              href={tabURLs[i]}
            >
              {tabName}
            </Link>
          ))}
        </div>
      )}
      <div
        className={
          screenWidth < 45 * rem
            ? "flex flex-col items-center "
            : "flex flex-row justify-center space-x-3"
        }
      >
        <Link
          className="relative w-max hover:text-blue-600 hover:underline"
          href="https://github.com/na-trium-144/falling-nikochan"
        >
          <Github className="absolute bottom-1 left-0" />
          <span className="ml-5">na-trium-144/falling-nikochan</span>
        </Link>
        {screenWidth >= 25 * rem && (
          <div className="space-x-2">
            <span>Build</span>
            <span>{process.env.buildDate}</span>
            <span>({process.env.buildCommit})</span>
          </div>
        )}
      </div>
      <p className="my-1 text-center text-sm">
        ※ FallingNikochanは開発中です。
        予告なく仕様変更したりサーバーダウンしたりデータが消えたりする可能性があります。
      </p>
    </footer>
  );
}
