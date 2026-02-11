import clsx from "clsx/lite";
import { Box } from "@/common/box";
import { levelColors } from "@/common/levelColors";
import { JudgeIcon } from "@/play/statusBox";
import {
  baseScoreRate,
  bigScoreRate,
  chainScoreRate,
  inputTypes,
  levelTypes,
  rankStr,
  ResultParams,
} from "@falling-nikochan/chart";
import KeyboardOne from "@icon-park/react/lib/icons/KeyboardOne";
import MouseOne from "@icon-park/react/lib/icons/MouseOne";
import Write from "@icon-park/react/lib/icons/Write";
import ClickTap from "@icon-park/react/lib/icons/ClickTap";
import GameThree from "@icon-park/react/lib/icons/GameThree";
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
    if (props.result.date) {
      setResultDate(new Date(props.result.date).toLocaleDateString());
    }
  }, [props.result.date]);
  return (
    <Box classNameOuter="w-max max-w-full mx-auto py-4 px-6 mt-4">
      <p className="fn-heading-box">&lt; {th("sharedResult")} &gt;</p>
      <p className="text-center ">
        {props.result.lvName && (
          <span className="font-title mr-2">{props.result.lvName}</span>
        )}
        <span
          className={clsx(
            "inline-block mr-2",
            levelColors[props.result.lvType]
          )}
        >
          <span className="text-sm">{levelTypes[props.result.lvType]}-</span>
          <span className="text-lg">{props.result.lvDifficulty}</span>
        </span>
        {props.result.playbackRate4 !== 4 && (
          <span className="inline-block mr-2">
            <span className="mr-1">{t("playbackRate")}:</span>
            <span className="text-lg">×{props.result.playbackRate4 / 4}</span>
          </span>
        )}
        {props.result.date && (
          <span className="inline-block text-dim">
            <span>(</span>
            <span>{resultDate}</span>
            {props.result.inputType === inputTypes.keyboard ? (
              <KeyboardOne className="inline-block ml-2 align-middle " />
            ) : props.result.inputType === inputTypes.mouse ? (
              <MouseOne className="inline-block ml-2 align-middle " />
            ) : props.result.inputType === inputTypes.pen ? (
              <Write className="inline-block ml-2 align-middle " />
            ) : props.result.inputType === inputTypes.touch ? (
              <ClickTap className="inline-block ml-2 align-middle " />
            ) : props.result.inputType === inputTypes.gamepad ? (
              <GameThree className="inline-block ml-2 align-middle " />
            ) : null}
            <span>)</span>
          </span>
        )}
      </p>
      <div
        className={clsx(
          "flex flex-col justify-center items-center gap-2",
          "main-wide:flex-row main-wide:gap-6"
        )}
      >
        <div
          className={clsx(
            "flex flex-col items-center gap-2",
            "share-wide2:flex-row share-wide2:gap-6"
          )}
        >
          <div className="flex flex-col w-48">
            {(
              [
                ["baseScore", props.result.baseScore100],
                ["chainBonus", props.result.chainScore100],
                ["bigNoteBonus", props.result.bigScore100],
              ] as const
            ).map(([name, score100], i) => (
              <p
                key={i}
                className={clsx(
                  "flex flex-row w-full items-baseline",
                  name === "bigNoteBonus" &&
                    props.result.bigCount === null &&
                    "text-dim"
                )}
              >
                <span className="flex-1 text-sm ">{t(name)}:</span>
                <span className="text-2xl">{Math.floor(score100 / 100)}</span>
                <span className="">.</span>
                <span className="text-left w-5 ">
                  {(score100 % 100).toString().padStart(2, "0")}
                </span>
              </p>
            ))}
            <div className="mt-1 border-b border-slate-800 dark:border-stone-300" />
            <p className="flex flex-row w-full items-baseline ">
              <span className="flex-1 text-sm ">{t("totalScore")}:</span>
              <span className="text-2xl">
                {Math.floor(props.result.score100 / 100)}
              </span>
              <span className="">.</span>
              <span className="text-left w-5 ">
                {(props.result.score100 % 100).toString().padStart(2, "0")}
              </span>
            </p>
          </div>
          <div className="w-40 flex flex-col justify-center items-center ">
            <div>
              <span className="mr-2">{t("rank")}:</span>
              <span className="text-3xl">
                {rankStr(props.result.score100 / 100)}
              </span>
            </div>
            {props.result.chainScore100 === chainScoreRate * 100 ? (
              <div className="text-xl">
                <span className="">
                  {props.result.baseScore100 === baseScoreRate * 100
                    ? t("perfect")
                    : t("full")}
                </span>
                {props.result.bigScore100 === bigScoreRate * 100 && (
                  <span className="font-bold">+</span>
                )}
                <span>!</span>
              </div>
            ) : null}
          </div>
        </div>
        <div className={clsx("w-32 flex flex-col justify-center", "text-dim")}>
          {["good", "ok", "bad", "miss"].map((name, ji) => (
            <div key={ji} className="flex flex-row items-baseline ">
              <span className="inline-block text-sm w-4 translate-y-0.5">
                <JudgeIcon index={ji} />
              </span>
              <span className="flex-1 text-xs ">{ts(name)}</span>
              <span className="text-base ">{props.result.judgeCount[ji]}</span>
            </div>
          ))}
          {props.result.bigCount !== false && (
            <div
              className={clsx(
                "flex flex-row items-baseline",
                props.result.bigCount === null && "text-dim"
              )}
            >
              <span className="flex-1 text-xs ">{ts("big")}</span>
              <span className="text-base ">{props.result.bigCount || 0}</span>
            </div>
          )}
        </div>
      </div>
    </Box>
  );
}
