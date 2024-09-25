"use client";

import { Key } from "@/common/key";
import TargetLine from "@/common/targetLine";
import { useDisplayMode } from "@/scale";
import { useCallback, useEffect, useState } from "react";

export function AboutContent2() {
  const [nikochanPhase, setNikochanPhase] = useState<number>(0);
  const [barFlash, setBarFlash] = useState<boolean>(false);
  const [chain, setChain] = useState<number>(0);
  const flash = useCallback(() => {
    setBarFlash(true);
    setTimeout(() => setBarFlash(false), 100);
  }, []);
  useEffect(() => {
    switch (nikochanPhase) {
      case 0: {
        const t = setTimeout(() => setNikochanPhase(1), 100);
        return () => clearTimeout(t);
      }
      case 1: {
        const t = setTimeout(() => setNikochanPhase(2), 800);
        return () => clearTimeout(t);
      }
      case 2: {
        flash();
        setChain((chain) => (chain + 1) % 100);
        const t = setTimeout(() => setNikochanPhase(0), 1100);
        return () => clearTimeout(t);
      }
    }
  }, [nikochanPhase, flash]);

  const { isMobile } = useDisplayMode();

  return (
    <>
      <div className={isMobile ? "flex flex-col space-y-2 items-center " : "flex flex-row space-x-2 mb-4 "}>
        <div className="flex-1 space-y-2 text-center">
          <p>
            ニコチャンが線に重なったときに音符を叩くだけの
            <br />
            簡単なルールです。
          </p>
          <p>
            PCなら(<Key className="px-0.5 mx-0.5">Esc</Key>
            以外の)どれかのキーを押して
            <br />
            タブレット・スマホなら画面のどこかをタップで
            <br />
            音符を叩きます。
          </p>
        </div>
        <div className={"shrink-0 relative " + (isMobile ? "w-60 h-28" : "basis-3/12 ")}>
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
              left: isMobile ? 80 : 40,
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
      <div className={isMobile ? "flex flex-col space-y-2 items-center " : "flex flex-row-reverse space-x-2 mb-4 "}>
        <div className="flex-1 space-y-2 text-center">
          <p>
          大きいニコチャンは2つのキーを同時押し<br />または2本指でタップすることで、<br />通常より多くのスコアが入ります。
        </p>
        <p>ミスせず連続でニコチャンを叩くと(chain)<br />得られるスコアも増えます。</p>
        </div>
        <div className={"shrink-0 relative " + (isMobile ? "w-60 h-28" : "basis-3/12 ")}>
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
              left: isMobile ? 80 : 40,
              bottom: 30 - 10 * 1.5,
            }}
          >
            <img
              src={`/nikochan${[0, 0, 1][nikochanPhase]}.svg`}
              className="w-full h-full "
            />
          </div>
        </div>

      </div>
    </>
  );
}
