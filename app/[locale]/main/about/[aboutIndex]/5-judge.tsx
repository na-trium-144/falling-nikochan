import {
  badFastSec,
  badLateSec,
  baseScoreRate,
  bigScoreRate,
  chainScoreRate,
  goodSec,
  okBaseScore,
  okSec,
} from "@/../../chartFormat/gameConstant.js";
import { rankStr } from "@/common/rank.js";
import { getTranslations } from "@/getTranslations";
import { JudgeIcon } from "@/play/statusBox.js";

interface Props {
  locale: string;
}
export async function AboutContent5(props: Props) {
  const t = await getTranslations(props.locale, "about.5");
  return (
    <>
      <div className="mb-4 space-y-2">
        <p>
          {t.rich("content1", {
            good: () => (
              <span className="relative inline-block">
                <span className="absolute left-0.5 bottom-1">
                  <JudgeIcon index={0} />
                </span>
                <span className="ml-5">Good</span>
                <span className="text-sm mx-0.5">(±{goodSec * 1000}ms)</span>
              </span>
            ),
            ok: () => (
              <span className="relative inline-block">
                <span className="absolute left-0.5 bottom-1">
                  <JudgeIcon index={1} />
                </span>
                <span className="ml-5">OK</span>
                <span className="text-sm mx-0.5">(±{okSec * 1000}ms)</span>
              </span>
            ),
            bad: () => (
              <span className="relative inline-block">
                <span className="absolute left-0.5 bottom-1">
                  <JudgeIcon index={2} />
                </span>
                <span className="ml-5">Bad</span>
                <span className="text-sm mx-0.5">
                  (+{badLateSec * 1000}ms 〜 {badFastSec * 1000}ms)
                </span>
              </span>
            ),
          })}
        </p>
        <p>
          {t.rich("content2", {
            total: baseScoreRate + chainScoreRate + bigScoreRate,
            totalSmall: baseScoreRate + chainScoreRate,
            b: (c) => <span className="font-bold">{c}</span>,
          })}
        </p>
        <ul className="list-inside list-disc">
          <li>
            {t.rich("content3", {
              baseScoreRate,
              okBaseScore,
              chainScoreRate,
              bigScoreRate,
              good: () => (
                <span className="relative inline-block">
                  <span className="absolute left-0.5 bottom-1">
                    <JudgeIcon index={0} />
                  </span>
                  <span className="ml-5 mr-1">Good</span>
                </span>
              ),
              ok: () => (
                <span className="relative inline-block">
                  <span className="absolute left-0.5 bottom-1">
                    <JudgeIcon index={1} />
                  </span>
                  <span className="ml-5 mr-1">OK</span>
                </span>
              ),
              b: (c) => <span className="font-bold">{c}</span>,
            })}
          </li>
          <li>
            {t.rich("content4", {
              chainScoreRate,
              b: (c) => <span className="font-bold">{c}</span>,
            })}
          </li>
          <li>
            {t.rich("content5", {
              bigScoreRate,
              b: (c) => <span className="font-bold">{c}</span>,
            })}
          </li>
        </ul>
      </div>
      <div className="mb-4 space-y-2">
        <p>
          {t.rich("content6", {
            rank: (c) => (
              <span>
                {rankStr(Number(c))}
                <span className="text-sm ml-0.5">({c}〜)</span>
              </span>
            ),
          })}
        </p>
      </div>
    </>
  );
}
