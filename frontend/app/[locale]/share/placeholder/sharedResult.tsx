import clsx from "clsx/lite";
import { Box } from "@/common/box";
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
  result: ResultParams | string;
}
export function SharedResultBox(props: Props) {
  const th = useTranslations("share");
  const t = useTranslations("play.result");
  const ts = useTranslations("play.status");
  const { result } = props;
  const [resultDate, setResultDate] = useState<string>("");
  useEffect(() => {
    if (typeof result === "object" && result.date) {
      setResultDate(new Date(result.date).toLocaleDateString());
    }
  }, [result]);
  return (
    <Box classNameOuter="w-max max-w-full mx-auto py-4 px-6 mt-4">
      <p className="fn-heading-box">&lt; {th("sharedResult")} &gt;</p>
      {typeof result === "string" ? (
        // error message
        <p className="text-center ">{result}</p>
      ) : (
        <>
          <p className="text-center ">
            {result.lvName && (
              <span className="font-title mr-2">{result.lvName}</span>
            )}
            <span
              className={clsx(
                "inline-block mr-2",
                "fn-level-type",
                levelTypes[result.lvType]
              )}
            >
              <span>{levelTypes[result.lvType]}-</span>
              <span>{result.lvDifficulty}</span>
            </span>
            {result.playbackRate4 !== 4 && (
              <span className="inline-block mr-2">
                <span className="mr-1">{t("playbackRate")}:</span>
                <span className="text-lg">×{result.playbackRate4 / 4}</span>
              </span>
            )}
            {result.date && (
              <span className="inline-block text-dim">
                <span>(</span>
                <span>{resultDate}</span>
                {result.inputType === inputTypes.keyboard ? (
                  <KeyboardOne className="inline-block ml-2 align-middle " />
                ) : result.inputType === inputTypes.mouse ? (
                  <MouseOne className="inline-block ml-2 align-middle " />
                ) : result.inputType === inputTypes.pen ? (
                  <Write className="inline-block ml-2 align-middle " />
                ) : result.inputType === inputTypes.touch ? (
                  <ClickTap className="inline-block ml-2 align-middle " />
                ) : result.inputType === inputTypes.gamepad ? (
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
                    ["baseScore", result.baseScore100],
                    ["chainBonus", result.chainScore100],
                    ["bigNoteBonus", result.bigScore100],
                  ] as const
                ).map(([name, score100], i) => (
                  <p
                    key={i}
                    className={clsx(
                      "flex flex-row w-full items-baseline",
                      name === "bigNoteBonus" &&
                        result.bigCount === null &&
                        "text-dim"
                    )}
                  >
                    <span className="flex-1 text-sm ">{t(name)}:</span>
                    <span className="text-2xl">
                      {Math.floor(score100 / 100)}
                    </span>
                    <span className="">.</span>
                    <span className="text-left w-5 ">
                      {(score100 % 100).toString().padStart(2, "0")}
                    </span>
                  </p>
                ))}
                <div className="mt-1 border-b border-base" />
                <p className="flex flex-row w-full items-baseline ">
                  <span className="flex-1 text-sm ">{t("totalScore")}:</span>
                  <span className="text-2xl">
                    {Math.floor(result.score100 / 100)}
                  </span>
                  <span className="">.</span>
                  <span className="text-left w-5 ">
                    {(result.score100 % 100).toString().padStart(2, "0")}
                  </span>
                </p>
              </div>
              <div className="w-40 flex flex-col justify-center items-center ">
                <div>
                  <span className="mr-2">{t("rank")}:</span>
                  <span className="text-3xl">
                    {rankStr(result.score100 / 100)}
                  </span>
                </div>
                {result.chainScore100 === chainScoreRate * 100 ? (
                  <div className="text-xl">
                    <span className="">
                      {result.baseScore100 === baseScoreRate * 100
                        ? t("perfect")
                        : t("full")}
                    </span>
                    {result.bigScore100 === bigScoreRate * 100 && (
                      <span className="font-bold">+</span>
                    )}
                    <span>!</span>
                  </div>
                ) : null}
              </div>
            </div>
            <div
              className={clsx("w-32 flex flex-col justify-center", "text-dim")}
            >
              {["good", "ok", "bad", "miss"].map((name, ji) => (
                <div key={ji} className="flex flex-row items-baseline ">
                  <JudgeIcon
                    index={ji}
                    className="inline-block text-sm w-4 translate-y-0.5"
                  />
                  <span className="flex-1 text-xs ">{ts(name)}</span>
                  <span className="text-base ">{result.judgeCount[ji]}</span>
                </div>
              ))}
              {result.bigCount !== false && (
                <div
                  className={clsx(
                    "flex flex-row items-baseline",
                    result.bigCount === null && "text-dim"
                  )}
                >
                  <span className="flex-1 text-xs ">{ts("big")}</span>
                  <span className="text-base ">{result.bigCount || 0}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Box>
  );
}
