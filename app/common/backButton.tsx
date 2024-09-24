import Link from "next/link";
import { ReactNode } from "react";

interface Props {
  className?: string;
  href: string;
  children: ReactNode | ReactNode[];
  reload?: boolean;
}
export default function BackButton(props: Props) {
  return (
    <div className={"mb-2 " + (props.className || "")}>
      {props.reload ? (
        <a
          href={props.href}
          className="mr-2 p-2 aspect-square rounded-full text-xl text-bold hover:bg-gray-200"
        >
          ←
        </a>
      ) : (
        <Link
          href={props.href}
          className="mr-2 p-2 aspect-square rounded-full text-xl text-bold hover:bg-gray-200"
        >
          ←
        </Link>
      )}
      <span className="">FallingNikochan</span>
      <span className="mx-2">/</span>
      <span className="text-xl">{props.children}</span>
    </div>
  );
}
