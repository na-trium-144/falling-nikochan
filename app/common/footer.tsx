"use client";

import { tabTitles, tabURLs } from "@/main/const";
import { EfferentThree, Github } from "@icon-park/react";
import Link from "next/link";
import { linkStyle1, linkStyle2 } from "./linkStyle";

interface Props {
  // trueで表示、または "main-wide:hidden" などのようにクラス指定
  nav?: boolean | string;
}
export default function Footer(props: Props) {
  return (
    <footer className="pb-3">
      {props.nav && (
        <div
          className={
            "text-center mb-3 divide-solid divide-black " +
            "flex flex-col space-y-1 items-stretch w-max mx-auto " +
            "footer-wide:divide-x footer-wide:space-y-0 footer-wide:flex-row " +
            (typeof props.nav === "string" ? props.nav : "")
          }
        >
          {tabURLs.map((tabURL, i) => (
            <Link key={i} className={"px-2 " + linkStyle1} href={tabURL}>
              {tabTitles[i]}
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
        <a
          className={"relative w-max " + linkStyle2}
          href="https://github.com/na-trium-144/falling-nikochan"
          target="_blank"
        >
          <Github className="absolute bottom-1 left-0" />
          <span className="ml-5 mr-5">na-trium-144/falling-nikochan</span>
          <EfferentThree className="absolute bottom-1 right-0" />
        </a>
        <Link className={"inline-block " + linkStyle1} href="/main/version">
          <span>ver.</span>
          <span className="mx-1">{process.env.buildVersion}</span>
          <span className="text-xs">(更新履歴はこちら)</span>
        </Link>
      </div>
    </footer>
  );
}
