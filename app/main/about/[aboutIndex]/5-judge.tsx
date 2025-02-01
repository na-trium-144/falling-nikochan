import {
  badFastSec,
  badLateSec,
  baseScoreRate,
  bigScoreRate,
  chainScoreRate,
  goodSec,
  okBaseScore,
  okSec,
} from "@/common/gameConstant.js";
import { rankStr } from "@/common/rank.js";
import { JudgeIcon } from "@/play/statusBox.js";

export function AboutContent5() {
  return (
    <>
      <div className="mb-4 space-y-2">
        <p>
          ニコチャンを
          <wbr />
          叩いた
          <wbr />
          タイミングに
          <wbr />
          よって、
          <span className="relative inline-block">
            <span className="absolute left-0.5 bottom-1">
              <JudgeIcon index={0} />
            </span>
            <span className="ml-5">Good</span>
            <span className="text-sm mx-0.5">(±{goodSec * 1000}ms)</span>
          </span>
          ,
          <span className="relative inline-block">
            <span className="absolute left-0.5 bottom-1">
              <JudgeIcon index={1} />
            </span>
            <span className="ml-5">OK</span>
            <span className="text-sm mx-0.5">(±{okSec * 1000}ms)</span>
          </span>
          ,
          <span className="relative inline-block">
            <span className="absolute left-0.5 bottom-1">
              <JudgeIcon index={2} />
            </span>
            <span className="ml-5">Bad</span>
            <span className="text-sm mx-0.5">
              (+{badLateSec * 1000}ms 〜 {badFastSec * 1000}ms)
            </span>
          </span>
          の<wbr />
          判定が
          <wbr />
          あります。
        </p>
        <p>
          スコアは Base Score, Chain Bonus, Big Note Bonus の<wbr />
          3つから
          <wbr />
          なり、
          <wbr />
          合計
          <span className="mx-0.5">
            {baseScoreRate + chainScoreRate + bigScoreRate}
          </span>
          点 (大きい
          <wbr />
          ニコチャンを
          <wbr />
          2本指で
          <wbr />
          叩かない
          <wbr />
          場合
          <span className="mx-0.5">{baseScoreRate + chainScoreRate}</span>
          点) が<wbr />
          最高と
          <wbr />
          なります。
        </p>
        <ul className="list-inside list-disc">
          <li>
            Base Score ({baseScoreRate} 点満点) は<wbr />
            叩いた
            <wbr />
            音符の
            <wbr />
            判定を
            <wbr />
            もとに
            <wbr />
            計算
            <wbr />
            されます。
            <wbr />
            すべて
            <span className="relative inline-block">
              <span className="absolute left-0.5 bottom-1">
                <JudgeIcon index={0} />
              </span>
              <span className="ml-5 mr-1">Good</span>
            </span>
            判定なら
            <wbr />
            合計 {baseScoreRate} 点に
            <wbr />
            なり、
            <span className="relative inline-block">
              <span className="absolute left-0.5 bottom-1">
                <JudgeIcon index={1} />
              </span>
              <span className="ml-5 mr-1">OK</span>
            </span>
            判定は
            <wbr />
            Good判定の {okBaseScore} 倍の
            <wbr />
            点数が
            <wbr />
            入ります。
          </li>
          <li>
            Chain Bonus ({chainScoreRate} 点満点) は<wbr />
            Chainに
            <wbr />
            応じて
            <wbr />
            入る
            <wbr />
            ボーナス
            <wbr />
            得点です。
            <wbr />
            Chainを
            <wbr />
            つなげれば
            <wbr />
            つなげる
            <wbr />
            ほど
            <wbr />
            増えます。
          </li>
          <li>
            Big Note Bonus ({bigScoreRate} 点満点) は<wbr />
            大きい
            <wbr />
            ニコチャンを
            <wbr />
            2本指で
            <wbr />
            叩いた
            <wbr />
            場合に
            <wbr />
            入る
            <wbr />
            ボーナス
            <wbr />
            得点です。
            <wbr />
          </li>
        </ul>
      </div>
      <div className="mb-4 space-y-2">
        <p>
          合計スコアに
          <wbr />
          応じて、
          <span className="mx-0.5">
            {rankStr(0)}
            {[70, 80, 90, 100, 110, 120].map((s) => (
              <>
                , {rankStr(s)}
                <span className="text-sm ml-0.5">({s}〜)</span>
              </>
            ))}
          </span>
          のランクで
          <wbr />
          評価
          <wbr />
          されます。
        </p>
      </div>
    </>
  );
}
