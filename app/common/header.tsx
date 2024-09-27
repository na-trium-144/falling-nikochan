import { CloseSmall, HamburgerButton } from "@icon-park/react";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { Box } from "./box";
import { tabTitles, tabURLs } from "@/main/main";

interface Props {
  children: ReactNode | ReactNode[];
  reload?: boolean;
}
export default function Header(props: Props) {
  return (
    <div className="p-3 pb-0 w-full ">
      {props.reload ? (
        <a href="/" className="text-xl hover:text-slate-500 ">
          FallingNikochan
        </a>
      ) : (
        <Link href="/" className="text-xl hover:text-slate-500 ">
          FallingNikochan
        </Link>
      )}
      <span className="ml-2">/</span>
      <span className="ml-2 inline-block">{props.children}</span>
    </div>
  );
}
