"use client";

import Link from "next/link";
import { linkStyle1 } from "./common/linkStyle.js";
import Title from "./common/titleLogo.js";
import { RedirectedWarning } from "./common/redirectedWarning.js";
import { PWAInstallMain, usePWAInstall } from "./common/pwaInstall.js";
import Footer, { pcTabTitleKeys, tabURLs } from "./common/footer.js";
import { useDisplayMode } from "./scale.js";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function TopPage({ locale }: { locale: string }) {
  const { screenWidth, rem } = useDisplayMode();
  const router = useRouter();
  const pwa = usePWAInstall();
  const tm = useTranslations("main");
  const [menuMoveLeft, setMenuMoveLeft] = useState<boolean>(false);
  return (
    <main className="flex flex-col w-full h-full items-center ">
      <Link
        href={`/${locale}`}
        className={
          "w-full grow-1 " + "shrink-0 basis-24 relative " + linkStyle1
        }
        style={{
          marginLeft: "-20rem",
          marginRight: "-20rem",
        }}
        prefetch={!process.env.NO_PREFETCH}
      >
        <Title className="absolute inset-0 " anim />
      </Link>
      <RedirectedWarning />
      <PWAInstallMain pwa={pwa} />
      <nav
        className={
          "shrink-0 basis-0 grow-2 " +
          "hidden main-wide:flex " +
          "flex-col justify-center w-60 " +
          "transition ease-out duration-200 "
        }
        style={{
          transform: menuMoveLeft
            ? `translateX(-${
                (screenWidth - (60 / 4) * rem - (12 / 4) * rem) / 2
              }px)`
            : undefined,
        }}
      >
        {pcTabTitleKeys.map((key, i) => (
          <Link
            key={i}
            href={`/${locale}${tabURLs[key]}`}
            className={
              " text-center hover:bg-sky-200 hover:dark:bg-orange-950 active:shadow-inner " +
              "rounded-lg p-3 "
            }
            prefetch={!process.env.NO_PREFETCH}
            onClick={(e) => {
              setMenuMoveLeft(true);
              setTimeout(() => {
                router.push(`/${locale}${tabURLs[key]}`);
              }, 150);
              e.preventDefault();
            }}
          >
            {tm(key + ".title")}
          </Link>
        ))}
      </nav>
      <Footer locale={locale} pwa={pwa} />
    </main>
  );
}
