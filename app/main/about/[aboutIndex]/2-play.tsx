"use client";

import { Key } from "@/common/key";
import TargetLine from "@/common/targetLine";
import { useDisplayMode } from "@/scale";
import { useCallback, useEffect, useState } from "react";

export function AboutContent2() {
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

  const { screenWidth, rem } = useDisplayMode();
  const isMobile = screenWidth < 40 * rem;

  return (
    <>
      <div
        className={
          isMobile
            ? "flex flex-col space-y-2 items-center "
            : "flex flex-row space-x-2 mb-4 "
        }
      >
        <div className="flex-1 space-y-2">
          <p>
            ニコチャンが
            <wbr />
            線に
            <wbr />
            重なった
            <wbr />
            ときに
            <wbr />
            音符を
            <wbr />
            叩くだけの
            <wbr />
            簡単な
            <wbr />
            ルールです。
          </p>
          <p>
            PC なら (<Key className="px-0.5 mx-0.5">Esc</Key> 以外の) どれかの
            <wbr />
            キーを
            <wbr />
            押して、
            {/*優先的にここで改行してほしい*/}
            <span className="inline-block">タブレット・スマホなら</span>
            画面の
            <wbr />
            どこかを
            <wbr />
            タップで
            <wbr />
            音符を
            <wbr />
            叩きます。
          </p>
        </div>
        <div
          className={
            "shrink-0 relative " +
            (isMobile ? "max-w-full w-60 h-28" : "basis-3/12 ")
          }
        >
          <TargetLine barFlash={barFlash} left={0} right={0} bottom={30} />
          <div
            className={
              "absolute " +
              (nikochanPhase === 0
                ? "-translate-y-28 translate-x-14"
                : nikochanPhase === 1
                ? "transition ease-linear duration-700"
                : "transition ease-linear duration-300 -translate-y-4 opacity-0 scale-125")
            }
            style={{
              /* noteSize: にこちゃんのサイズ(boxSizeに対する比率), boxSize: 画面のサイズ */
              width: 20,
              height: 20,
              left: "30%",
              bottom: 30 - 10,
            }}
          >
            <img
              src={`/nikochan${[0, 0, 1][nikochanPhase]}.svg`}
              className="w-full h-full "
            />
          </div>
        </div>
      </div>
      <div
        className={
          isMobile
            ? "flex flex-col space-y-2 items-center "
            : "flex flex-row-reverse space-x-2 mb-4 "
        }
      >
        <div className="flex-1 space-y-2 text-center">
          <p>
            大きい
            <wbr />
            ニコチャンは
            <wbr />
            2つの
            <wbr />
            キーを
            <wbr />
            同時押し、
            <wbr />
            または
            <wbr />
            2本指で
            <wbr />
            タップする
            <wbr />
            ことで、
            <wbr />
            通常より
            <wbr />
            多くの
            <wbr />
            スコアが
            <wbr />
            入ります。
          </p>
          <p>
            ミスせず
            <wbr />
            連続で
            <wbr />
            ニコチャンを
            <wbr />
            叩くと、
            <wbr />
            得られる
            <wbr />
            スコアも
            <wbr />
            増えます。
          </p>
        </div>
        <div
          className={
            "shrink-0 relative " +
            (isMobile ? "max-w-full w-60 h-28" : "basis-3/12 ")
          }
        >
          <div className="absolute top-0 left-0">
            <span className="inline-block text-lg w-6 text-right">{chain}</span>
            <span className="text-xs ml-1">Chains</span>
          </div>
          <TargetLine barFlash={barFlash} left={0} right={0} bottom={30} />
          <div
            className={
              "absolute " +
              (nikochanPhase === 0
                ? "-translate-y-28 translate-x-14"
                : nikochanPhase === 1
                ? "transition ease-linear duration-700"
                : "transition ease-linear duration-300 -translate-y-4 opacity-0 scale-125")
            }
            style={{
              /* noteSize: にこちゃんのサイズ(boxSizeに対する比率), boxSize: 画面のサイズ */
              width: 20 * 1.5,
              height: 20 * 1.5,
              left: "30%",
              bottom: (fail ? 20 : 30) - 10 * 1.5,
            }}
          >
            <img
              src={`/nikochan${[0, 0, fail ? 3 : 1][nikochanPhase]}.svg`}
              className="w-full h-full "
            />
          </div>
        </div>
      </div>
    </>
  );
}
