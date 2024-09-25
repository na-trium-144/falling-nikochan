"use client";

import { useDisplayMode } from "@/scale";

export function AboutContent1() {
  const { screenWidth, rem } = useDisplayMode();
  const isMobile = screenWidth < 40 * rem;

  return (
    <>
      <div className="mb-4 space-y-2 text-center">
        <p>
          ダウンロード不要でブラウザーからすぐに遊べる、
          <br />
          シンプルでかわいいリズムゲームです。
        </p>
        <p>
          PCだけでなくタブレットやスマートフォンなどでも{isMobile && <br />}
          手軽に遊べます。
          <br />
          音楽ゲームにあまり馴染みがない方でも{isMobile && <br />}
          楽しめるようにしています。
        </p>
      </div>
      <div className="mb-4 space-y-2 text-center">
        <p>
          さらに、FallingNikochanでは遊ぶだけでなく
          <br />
          誰でも譜面を作成することができます。
        </p>
        <p>
          作成した譜面はサーバーに保存され、
          <br />
          SNSなどで共有すれば他の人に遊んでもらうこともできます。
        </p>
      </div>
    </>
  );
}
