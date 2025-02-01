"use client";

import { Key } from "@/common/key.js";
import TargetLine from "@/common/targetLine.js";
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

  return (
    <>
      <div
        className={
          "flex flex-col space-y-2 items-center " +
          "main-wide:flex-row main-wide:space-y-0 main-wide:space-x-2 " +
          "main-wide:items-stretch main-wide:mb-4 "
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
            ニコチャンの
            <wbr />
            位置や
            <wbr />
            飛び方に
            <wbr />
            よらず、 PC なら (<Key className="px-0.5 mx-0.5">Esc</Key> 以外の)
            どれかの
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
            タップする
            <wbr />
            ことで
            <wbr />
            音符を
            <wbr />
            叩くことが
            <wbr />
            できます。
          </p>
        </div>
        <div
          className={
            "shrink-0 relative " +
            "max-w-full w-60 h-28 " +
            "main-wide:basis-3/12 main-wide:w-auto main-wide:min-h-full"
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
        className={
          "flex flex-col space-y-2 items-center " +
          "main-wide:flex-row-reverse main-wide:space-y-0 main-wide:space-x-2 " +
          "main-wide:mb-4 "
        }
      >
        <div className="flex-1 space-y-2 text-center">
          <p>
            大きい
            <wbr />
            ニコチャンも
            <wbr />
            通常の
            <wbr />
            ニコチャンと
            <wbr />
            同じように
            <wbr />
            叩けますが、
            <wbr />
            2つの
            <wbr />
            キーを
            <wbr />
            同時押し
            <wbr />
            または
            <wbr />
            2本指で
            <wbr />
            タップする
            <wbr />
            と、
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
            叩くほど Chain ボーナス点が
            <wbr />
            入り、
            <wbr />
            より多くの
            <wbr />
            スコアが
            <wbr />
            もらえます。
          </p>
        </div>
        <div
          className={
            "shrink-0 relative " +
            "max-w-full w-60 h-28 " +
            "main-wide:basis-3/12 main-wide:w-auto main-wide:min-h-full"
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
              src={
                process.env.ASSET_PREFIX +
                `/assets/nikochan${[0, 0, fail ? 3 : 1][nikochanPhase]}.svg`
              }
              className="w-full h-full "
            />
          </div>
        </div>
      </div>
    </>
  );
}
