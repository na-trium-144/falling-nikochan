"use client";

import { Key } from "@/common/key";
import TargetLine from "@/common/targetLine";
import { IndexMain } from "@/main/main";
import { useDisplayMode } from "@/scale";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const maxIndex = 3;
export default function AboutTab(context: { params: Params }) {
  const aboutIndex = Number(context.params.aboutIndex);

  return (
    <IndexMain tab={0}>
      <div className="flex-1">
        <AboutContent index={aboutIndex} />
      </div>
      <div className="flex flex-row items-baseline">
        <div className="flex-1 text-right">
          {aboutIndex > 1 && (
            <Link
              className="p-2 aspect-square rounded-full text-xl text-bold hover:bg-gray-200"
              href={`/main/about/${aboutIndex - 1}`}
            >
              &lt;
            </Link>
          )}
        </div>
        <span className="w-6 text-right">{aboutIndex}</span>
        <span className="mx-2">/</span>
        <span className="w-6 text-left">{maxIndex}</span>
        <div className="flex-1 text-left">
          {aboutIndex < maxIndex && (
            <Link
              className="p-2 aspect-square rounded-full text-xl text-bold hover:bg-gray-200"
              href={`/main/about/${aboutIndex + 1}`}
            >
              &gt;
            </Link>
          )}
        </div>
      </div>
    </IndexMain>
  );
}

function AboutContent1() {
  return (
    <>
      <h3 className="text-xl font-bold font-title">FallingNikochanの概要</h3>
      <ul className="list-inside list-disc">
        <li>
          ダウンロード不要でブラウザーからすぐに遊べる、シンプルでかわいいリズムゲームです。
        </li>
        <li>
          PCだけでなくタブレットやスマートフォンなどでも手軽に遊べるのが特徴で、音楽ゲームにあまり馴染みがない方でも楽しめると思います。
        </li>
        <li>
          さらに、プレイするだけでなく誰でも簡単に譜面を作成でき、それをSNSなどでシェアして遊んでもらうこともできます
        </li>
        <li>todo: 概要説明が文章だけでダサいのでなんとかする</li>
      </ul>
    </>
  );
}
function AboutContent2() {
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
      <h3 className="text-xl font-bold font-title mb-4">
        FallingNikochanのルール
      </h3>
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
function AboutContent3() {
  return (
    <>
      <h3 className="text-xl font-bold font-title">譜面を作ろう</h3>
      <ul className="list-inside list-disc">
        <li>YouTubeにある好きな楽曲にあわせて、譜面を作ることができます</li>
        <li>
          音源はダウンロードされるのではなく、YouTube自体がアプリ内に埋め込まれているため、YouTubeで公開されている楽曲を使う分には権利的な問題は発生しません。
        </li>
        <li className="pl-8">
          (FallingNikochanで音源を再生するとYouTube上の元の動画の再生回数が1増えます)
        </li>
        <li>
          作った譜面は、URLまたは譜面IDを公開することで、他の人に遊んでもらうことができます
        </li>
      </ul>
    </>
  );
}
function AboutContent(props: { index: number }) {
  switch (props.index) {
    case 1:
      return <AboutContent1 />;
    case 2:
      return <AboutContent2 />;
    case 3:
      return <AboutContent3 />;
    default:
      return <p>Not Found</p>;
  }
}
