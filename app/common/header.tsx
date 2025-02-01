import Link from "next/link";
import { ReactNode } from "react";
import { linkStyle1 } from "./linkStyle.js";

interface Props {
  className?: string;
  children: ReactNode | ReactNode[];
  reload?: boolean;
}
export default function Header(props: Props) {
  return (
    <div className={"p-3 pb-0 w-full " + props.className}>
      {props.reload ? (
        <a href="/" className={"text-xl " + linkStyle1}>
          FallingNikochan
        </a>
      ) : (
        <Link href="/" className={"text-xl " + linkStyle1} prefetch={false}>
          FallingNikochan
        </Link>
      )}
      <span className="ml-2">/</span>
      <span className="ml-2 inline-block">{props.children}</span>
    </div>
  );
}
