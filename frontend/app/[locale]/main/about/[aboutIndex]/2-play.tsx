"use client";

import clsx from "clsx/lite";
import { Key } from "@/common/key.js";
import TargetLine from "@/common/targetLine.js";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import Caution from "@icon-park/react/lib/icons/Caution.js";

export function AboutContent2() {
  const t = useTranslations("about.2");
  const [nikochanPhase, setNikochanPhase] = useState<number>(0);
  const [barFlash, setBarFlash] = useState<boolean>(false);
  const [chain, setChain] = useState<number>(0);
  const fail =
    (chain == 0 && nikochanPhase == 2) || (chain == 9 && nikochanPhase < 2);
  const flash = useCallback(() => {
    setBarFlash(true);
    setTimeout(() => setBarFlash(false), 100);
  }, []);
  useEffect(() => {
    switch (nikochanPhase) {
      case 0: {
        const t = setTimeout(
          () => requestAnimationFrame(() => setNikochanPhase(1)),
          100
        );
        return () => clearTimeout(t);
      }
      case 1: {
        const t = setTimeout(
          () => requestAnimationFrame(() => setNikochanPhase(2)),
          800
        );
        return () => clearTimeout(t);
      }
      case 2: {
        flash();
        setChain((chain) => (chain + 1) % 10);
        const t = setTimeout(
          () => requestAnimationFrame(() => setNikochanPhase(0)),
          1100
        );
        return () => clearTimeout(t);
      }
    }
  }, [nikochanPhase, flash]);

  return (
    <>
      <div
        className={clsx(
          "flex flex-col space-y-2 items-center",
          "main-wide:flex-row main-wide:space-y-0 main-wide:space-x-2",
          "main-wide:items-stretch main-wide:mb-4"
        )}
      >
        <div className="flex-1 space-y-2">
          <p>{t("content1")}</p>
          <p>
            {/*優先的に改行してほしい位置にinlineBlockを入れる*/}
            {t.rich("content2", {
              key: (c) => <Key className="px-0.5 mx-0.5">{c}</Key>,
              inlineBlock: (c) => <span className="inline-block">{c}</span>,
            })}
          </p>
        </div>
        <div
          className={clsx(
            "shrink-0 relative",
            "max-w-full w-60 h-28",
            "main-wide:basis-3/12 main-wide:w-auto main-wide:min-h-full"
          )}
        >
          <TargetLine barFlash={barFlash} left={0} right={0} bottom={30} />
          <div
            className={clsx(
              "absolute",
              nikochanPhase === 0 && "-translate-y-28 translate-x-14",
              nikochanPhase === 1 && "transition ease-linear duration-700",
              nikochanPhase === 2 &&
                "transition ease-linear duration-300 -translate-y-4 opacity-0 scale-125"
            )}
            style={{
              /* noteSize: にこちゃんのサイズ(boxSizeに対する比率), boxSize: 画面のサイズ */
              width: 20,
              height: 20,
              left: "30%",
              bottom: 30 - 10,
            }}
          >
            <img
              src={
                process.env.ASSET_PREFIX +
                `/assets/nikochan${[0, 0, 1][nikochanPhase]}.svg`
              }
              className="w-full h-full "
            />
          </div>
        </div>
      </div>
      <div
        className={clsx(
          "flex flex-col space-y-2 items-center",
          "main-wide:flex-row-reverse main-wide:space-y-0 main-wide:space-x-2",
          "main-wide:mb-4"
        )}
      >
        <div className="flex-1 space-y-2 text-center">
          <p>{t("content3")}</p>
          <p>{t("content4")}</p>
        </div>
        <div
          className={clsx(
            "shrink-0 relative",
            "max-w-full w-60 h-28",
            "main-wide:basis-3/12 main-wide:w-auto main-wide:min-h-full"
          )}
        >
          <div className="absolute top-0 left-0">
            <span className="inline-block text-lg w-6 text-right">{chain}</span>
            <span className="text-xs ml-1">{t("chain", { chain })}</span>
          </div>
          <TargetLine barFlash={barFlash} left={0} right={0} bottom={30} />
          <div
            className={clsx(
              "absolute",
              nikochanPhase === 0 && "-translate-y-28 translate-x-14",
              nikochanPhase === 1 && "transition ease-linear duration-700",
              nikochanPhase === 2 &&
                "transition ease-linear duration-300 -translate-y-4 opacity-0 scale-125"
            )}
            style={{
              /* noteSize: にこちゃんのサイズ(boxSizeに対する比率), boxSize: 画面のサイズ */
              width: 20 * 1.5,
              height: 20 * 1.5,
              left: "30%",
              bottom: (fail ? 20 : 30) - 10 * 1.5,
            }}
          >
            <img
              src={
                process.env.ASSET_PREFIX +
                `/assets/nikochan${[0, 0, fail ? 3 : 1][nikochanPhase]}.svg`
              }
              className="w-full h-full "
            />
          </div>
        </div>
      </div>
      <div className="mb-4 text-sm space-y-2">
        <p className="">
          <Caution className="inline-block mr-1 translate-y-0.5 " />
          {t("contentIOS")}
        </p>
        <ul className="list-inside list-disc-as-text">
          <li>{t("contentIOS2")}</li>
          <li>{t("contentIOS3")}</li>
        </ul>
      </div>
    </>
  );
}
