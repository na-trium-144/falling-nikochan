"use client";

import {
  badFastSec,
  badLateSec,
  baseScoreRate,
  bigScoreRate,
  chainScoreRate,
  goodSec,
  okBaseScore,
  okSec,
  rankStr,
} from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { JudgeIcon } from "@/play/statusBox.js";

export function AboutContent5() {
  const t = useTranslations("about.5");
  return (
    <>
      <div className="mb-4 space-y-2">
        <p>
          {t.rich("content1", {
            good: (c) => (
              <span className="relative inline-block">
                <span className="absolute left-0.5 bottom-1">
                  <JudgeIcon index={0} />
                </span>
                <span className="ml-5">{c}</span>
                <span className="text-sm mx-0.5">(±{goodSec * 1000}ms)</span>
              </span>
            ),
            ok: (c) => (
              <span className="relative inline-block">
                <span className="absolute left-0.5 bottom-1">
                  <JudgeIcon index={1} />
                </span>
                <span className="ml-5">{c}</span>
                <span className="text-sm mx-0.5">(±{okSec * 1000}ms)</span>
              </span>
            ),
            bad: (c) => (
              <span className="relative inline-block">
                <span className="absolute left-0.5 bottom-1">
                  <JudgeIcon index={2} />
                </span>
                <span className="ml-5">{c}</span>
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
              good: (c) => (
                <span className="relative inline-block">
                  <span className="absolute left-0.5 bottom-1">
                    <JudgeIcon index={0} />
                  </span>
                  <span className="ml-5 mr-1">{c}</span>
                </span>
              ),
              ok: (c) => (
                <span className="relative inline-block">
                  <span className="absolute left-0.5 bottom-1">
                    <JudgeIcon index={1} />
                  </span>
                  <span className="ml-5 mr-1">{c}</span>
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
