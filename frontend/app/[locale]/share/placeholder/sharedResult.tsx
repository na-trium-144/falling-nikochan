import { Box } from "@/common/box";
import { JudgeIcon } from "@/play/statusBox";
import {
  baseScoreRate,
  bigScoreRate,
  chainScoreRate,
  rankStr,
  ResultParams,
} from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface Props {
  result: ResultParams;
}
export function SharedResultBox(props: Props) {
  const th = useTranslations("share");
  const t = useTranslations("play.result");
  const ts = useTranslations("play.status");
  const [resultDate, setResultDate] = useState<string>("");
  useEffect(() => {
    setResultDate(new Date(props.result.date).toLocaleDateString());
  }, [props.result.date]);
  return (
    <Box className="mx-auto p-4 ">
      <p className="text-lg font-title font-bold text-center ">
        &lt; {th("sharedResult")} &gt;
      </p>
      <p className="text-center text-slate-500 dark:text-stone-400 ">
        ({resultDate})
      </p>
      <div className="flex flex-row space-x-6 ">
        <div className="flex flex-col">
          {(
            [
              ["baseScore", props.result.baseScore],
              ["chainBonus", props.result.chainScore],
              ["bigNoteBonus", props.result.bigScore],
            ] as const
          ).map(([name, score], i) => (
            <p key={i} className="flex flex-row w-full items-baseline ">
              <span className="flex-1 text-sm ">{t(name)}:</span>
              <span className="text-2xl">{Math.floor(score)}</span>
              <span className="">.</span>
              <span className="text-left w-5 ">
                {(Math.floor(score * 100) % 100).toString().padStart(2, "0")}
              </span>
            </p>
          ))}
          <div className="mt-1 border-b border-slate-800 dark:border-stone-300" />
          <p className="flex flex-row w-full items-baseline ">
            <span className="flex-1 text-sm ">{t("totalScore")}:</span>
            <span className="text-2xl">
              {Math.floor(
                props.result.baseScore +
                  props.result.chainScore +
                  props.result.bigScore
              )}
            </span>
            <span className="">.</span>
            <span className="text-left w-5 ">
              {(
                Math.floor(
                  (props.result.baseScore +
                    props.result.chainScore +
                    props.result.bigScore) *
                    100
                ) % 100
              )
                .toString()
                .padStart(2, "0")}
            </span>
          </p>
        </div>
        <div className="flex-none flex flex-col justify-center items-center ">
          <div>
            <span className="mr-2">{t("rank")}:</span>
            <span className="text-3xl">
              {rankStr(
                props.result.baseScore +
                  props.result.chainScore +
                  props.result.bigScore
              )}
            </span>
          </div>
          {props.result.chainScore === chainScoreRate ? (
            <div className="text-xl">
              <span className="">
                {props.result.baseScore === baseScoreRate
                  ? t("perfect")
                  : t("full")}
              </span>
              {props.result.bigScore === bigScoreRate && (
                <span className="font-bold">+</span>
              )}
              <span>!</span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col justify-center ">
          {["good", "ok", "bad", "miss"].map((name, ji) => (
            <div key={ji} className="flex flex-row items-baseline ">
              <span className="inline-block w-5 translate-y-1">
                <JudgeIcon index={ji} />
              </span>
              <span className="flex-1 text-sm ">{ts(name)}</span>
              <span className="text-lg/6 ">{props.result.judgeCount[ji]}</span>
            </div>
          ))}
          <div className="flex flex-row items-baseline ">
            <span className="flex-1 text-sm ">{ts("big")}</span>
            <span className="text-lg/6 ">{props.result.bigCount}</span>
          </div>
        </div>
      </div>
    </Box>
  );
}
