"use client";

import { tabTitles, tabURLs } from "@/main/const";
import { Github } from "@icon-park/react";
import Link from "next/link";

interface Props {
  nav?: boolean;
}
export default function Footer(props: Props) {
  return (
    <footer className="">
      {props.nav && (
        <div
          className={
            "text-center mb-3 divide-solid divide-black " +
            "flex flex-col space-y-1 items-stretch w-max mx-auto " +
            "footer-wide:divide-x footer-wide:space-y-0 footer-wide:flex-row "
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
          "flex flex-col items-center justify-center " +
          "footer-wide2:flex-row footer-wide2:items-baseline footer-wide2:space-x-3"
        }
      >
        <Link
          className="relative w-max hover:text-blue-600 hover:underline"
          href="https://github.com/na-trium-144/falling-nikochan"
        >
          <Github className="absolute bottom-1 left-0" />
          <span className="ml-5">na-trium-144/falling-nikochan</span>
        </Link>
        <div className="hidden footer-wide:inline-block space-x-2">
          <span>Build</span>
          <span>{process.env.buildDate}</span>
          <span>({process.env.buildCommit})</span>
        </div>
      </div>
    </footer>
  );
}
