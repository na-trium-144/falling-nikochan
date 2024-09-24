import { Github } from "@icon-park/react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="">
      <p className="my-1">
        <Link
          className={
            "w-max m-auto flex flex-row items-center justify-center " +
            "hover:text-blue-600 hover:underline"
          }
          href="https://github.com/na-trium-144/falling-nikochan"
        >
          <Github />
          <span className="ml-2">na-trium-144/falling-nikochan</span>
        </Link>
      </p>
      <p className="my-1 text-center text-sm">
        ※ FallingNikochanは開発中です。
        予告なく仕様変更したりサーバーダウンしたりデータが消えたりする可能性があります。
      </p>
    </footer>
  );
}
