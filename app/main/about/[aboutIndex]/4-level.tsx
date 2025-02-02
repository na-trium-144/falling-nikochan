import { levelTypes } from "@/../chartFormat/chart.js";
import { levelColors } from "@/common/levelColors";

export function AboutContent4() {
  return (
    <>
      <div className="mb-4 space-y-2">
        <p>
          1つの
          <wbr />
          楽曲に
          <wbr />
          複数の
          <wbr />
          譜面 (レベル) が<wbr />
          用意されている
          <wbr />
          場合が
          <wbr />
          あります。
          <wbr />
          譜面ごとに
          <span className={"inline-block ml-0.5 " + levelColors[0]}>
            <span className="text-sm">{levelTypes[0]}-</span>
            <span className="">4</span>
          </span>
          ,
          <span className={"inline-block ml-0.5 " + levelColors[1]}>
            <span className="text-sm">{levelTypes[1]}-</span>
            <span className="">8</span>
          </span>
          ,
          <span className={"inline-block ml-0.5 mr-0.5 " + levelColors[2]}>
            <span className="text-sm">{levelTypes[2]}-</span>
            <span className="">12</span>
          </span>
          などの
          <wbr />
          ように
          <wbr />
          難易度が
          <wbr />
          表記
          <wbr />
          されています。
        </p>
        <p>
          <span className={"mx-1 " + levelColors[0]}>{levelTypes[0]}</span>
          は片手で、
          <span className={"mx-1 " + levelColors[1]}>{levelTypes[1]}</span>
          は
          <wbr />
          2本以上の
          <wbr />
          指
          <wbr />
          または
          <wbr />
          両手で
          <wbr />
          プレイする
          <wbr />
          ことが
          <wbr />
          想定された
          <wbr />
          譜面である
          <wbr />
          ことを
          <wbr />
          表しています。 (必ずしも
          <wbr />
          表記通りに
          <wbr />
          プレイ
          <wbr />
          しなければ
          <wbr />
          ならない
          <wbr />
          わけでは
          <wbr />
          ないです)
        </p>
        <p>
          難易度の
          <wbr />
          後ろの
          <wbr />
          数字 (1〜20) は<wbr />
          その譜面の
          <wbr />
          難しさ (降ってくる
          <wbr />
          ニコチャンの
          <wbr />
          量) を<wbr />
          表して
          <wbr />
          います。 (あくまで
          <wbr />
          目安として
          <wbr />
          活用して
          <wbr />
          ください)
        </p>
      </div>
    </>
  );
}
