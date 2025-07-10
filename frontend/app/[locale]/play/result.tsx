"use client";

import { CenterBox } from "@/common/box.js";
import Button from "@/common/button.js";
import { useEffect, useRef, useState } from "react";
import "./result.css";
import {
  baseScoreRate,
  bigScoreRate,
  chainScoreRate,
  ChartBrief,
  rankStr,
  RecordGetSummary,
  ResultParams,
  serializeResultParams,
} from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { useShareLink } from "@/common/share";
import { useDisplayMode } from "@/scale";
import { RecordHistogram } from "@/common/recordHistogram";
import Pic from "@icon-park/react/lib/icons/Pic";

export const resultAnimDelays = [100, 500, 500, 500, 750, 750, 500] as const;

interface Props extends ResultParams {
  mainWindowHeight: number;
  hidden: boolean;
  lang: string;
  cid: string;
  brief: ChartBrief;
  isTouch: boolean;
  newRecord: number;
  auto: boolean;
  optionChanged: boolean;
  reset: () => void;
  exit: () => void;
  largeResult: boolean;
  record: RecordGetSummary | undefined;
}
export default function Result(props: Props) {
  const t = useTranslations("play.result");
  const { rem } = useDisplayMode();
  const ref = useRef<HTMLDivElement>(null);
  const refTotal = useRef<HTMLDivElement>(null);
  const refRank = useRef<HTMLDivElement>(null);
  const refBest = useRef<HTMLDivElement>(null);
  const scrollOptions = { behavior: "smooth", block: "end" } as const;
  const animScroll = useRef([
    null,
    null,
    null,
    () => refTotal.current?.scrollIntoView(scrollOptions),
    () => refRank.current?.scrollIntoView(scrollOptions),
    () => refBest.current?.scrollIntoView(scrollOptions),
    () =>
      ref.current?.scrollTo({
        top: ref.current!.scrollHeight,
        ...scrollOptions,
      }),
  ]);

  const messageRandom = useRef<number>(Math.random());

  const [serializedParam, setSerializedParam] = useState<string>("");
  const shareLink = useShareLink(
    props.cid,
    props.brief,
    props.lang,
    serializedParam,
    props.date ? props.date.getTime() : null
  );
  useEffect(() => {
    setSerializedParam(serializeResultParams(props));
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [
    props.date,
    props.lvName,
    props.lvType,
    props.lvDifficulty,
    props.baseScore100,
    props.chainScore100,
    props.bigScore100,
    props.score100,
    ...props.judgeCount,
    props.bigCount,
    /* eslint-enable react-hooks/exhaustive-deps */
  ]);

  const [showing, setShowing] = useState<number>(0);
  useEffect(() => {
    const offset: number[] = [];
    for (let i = 0; i < resultAnimDelays.length; i++) {
      offset.push((i > 0 ? offset[i - 1] : 0) + resultAnimDelays[i]);
    }
    const timers = offset.map((o, i) =>
      setTimeout(() => {
        setShowing(i + 1);
        if (animScroll.current.at(i)) {
          animScroll.current.at(i)!();
        }
      }, o)
    );
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const jumpingAnimation = (index: number) =>
    ({
      animationName: showing === index ? "result-score-jumping" : undefined,
      animationIterationCount: 1,
      animationDuration: "200ms",
      animationTimingFunction: "linear",
      animationFillMode: "forwards",
    }) as const;
  const appearingAnimation = (index: number) =>
    ({
      transitionProperty: "all",
      transitionTimingFunction: "ease-in",
      transitionDuration: "100ms",
      opacity: showing >= index ? 1 : 0,
      transform: showing >= index ? "scale(1)" : "scale(4)",
    }) as const;
  const appearingAnimation2 = (index: number) =>
    ({
      transitionProperty: "opacity",
      transitionTimingFunction: "ease-out",
      transitionDuration: "300ms",
      opacity: showing >= index ? 1 : 0,
    }) as const;
  const appearingAnimation3 = (index: number) =>
    ({
      transitionProperty: "opacity",
      transitionTimingFunction: "ease-out",
      transitionDuration: "150ms",
      opacity: showing >= index ? 1 : 0,
      visibility: showing >= index ? "visible" : "hidden",
    }) as const;
  return (
    <>
      <CenterBox
        ref={ref}
        className={
          "overflow-y-auto overflow-x-clip " +
          (props.hidden ? "hidden " : "") +
          (showing >= resultAnimDelays.length ? "touch-pan-y " : "touch-none ")
        }
        style={{ maxHeight: props.mainWindowHeight - 3 * rem }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <p className="text-lg font-title font-bold">&lt; {t("result")} &gt;</p>
        <div
          className={
            "my-2 flex justify-center items-center " +
            (props.largeResult ? "flwx-row space-x-2 " : "flex-col space-y-1 ")
          }
        >
          <div className="flex-1 w-56">
            <ResultRow
              visible={showing >= 1}
              name={t("baseScore")}
              scoreStyle={jumpingAnimation(1)}
              score100={props.baseScore100}
            />
            <ResultRow
              visible={showing >= 2}
              name={t("chainBonus")}
              scoreStyle={jumpingAnimation(2)}
              score100={props.chainScore100}
            />
            <ResultRow
              visible={showing >= 3}
              name={t("bigNoteBonus")}
              scoreStyle={
                props.bigCount === null
                  ? appearingAnimation3(3)
                  : jumpingAnimation(3)
              }
              score100={props.bigScore100}
              disabled={props.bigCount === null}
            />
            <div className="mt-2 mb-1 border-b border-slate-800 dark:border-stone-300" />
            <ResultRow
              visible={showing >= 4}
              name={t("totalScore")}
              scoreStyle={jumpingAnimation(4)}
              score100={props.score100}
            />
            <div ref={refTotal} />
          </div>
          <div
            ref={refRank}
            className={
              "flex-none w-56 flex flex-col justify-center items-center " +
              (props.largeResult ? "space-y-2 " : "space-y-1 ")
            }
          >
            <div style={{ ...appearingAnimation(5) }}>
              <span className="mr-2">{t("rank")}:</span>
              <span className={props.largeResult ? "text-4xl" : "text-3xl"}>
                {rankStr(props.score100 / 100)}
              </span>
            </div>
            {props.chainScore100 === chainScoreRate * 100 ? (
              <div
                className={props.largeResult ? "text-2xl" : "text-xl"}
                style={{ ...appearingAnimation(5) }}
              >
                <span className="">
                  {props.baseScore100 === baseScoreRate * 100
                    ? t("perfect")
                    : t("full")}
                </span>
                {props.bigScore100 === bigScoreRate * 100 && (
                  <span className="font-bold">+</span>
                )}
                <span>!</span>
              </div>
            ) : (
              <div
                className={props.largeResult ? "text-xl" : ""}
                style={{ ...appearingAnimation2(6) }}
              >
                {t(
                  "message." +
                    (props.score100 >= 9000
                      ? "A."
                      : props.score100 >= 7000
                        ? "B."
                        : "C.") +
                    (Math.floor(messageRandom.current * 3) + 1)
                )}
              </div>
            )}
            {props.newRecord > 0 && (
              <div ref={refBest} style={{ ...appearingAnimation2(6) }}>
                <span className={props.largeResult ? "text-xl " : ""}>
                  {t("newRecord")}
                </span>
                <span
                  className={"ml-1 " + (props.largeResult ? "" : "text-sm")}
                >
                  (+
                  {Math.floor(props.newRecord)}.
                  {(Math.floor(props.newRecord * 100) % 100)
                    .toString()
                    .padStart(2, "0")}
                  )
                </span>
              </div>
            )}
          </div>
        </div>
        {!props.auto &&
          !props.optionChanged &&
          (shareLink.toClipboard || shareLink.toAPI) && (
            <div
              className={
                "mb-2 " +
                (props.largeResult
                  ? "flex flex-row items-baseline justify-center space-x-2 "
                  : "flex flex-col items-center")
              }
              style={{ ...appearingAnimation3(7) }}
            >
              <span>{t("shareResult")}</span>
              <span className="inline-block space-x-1">
                {shareLink.toClipboard && (
                  <Button
                    text={t("copyLink")}
                    onClick={shareLink.toClipboard}
                  />
                )}
                {shareLink.toAPI && (
                  <Button text={t("shareLink")} onClick={shareLink.toAPI} />
                )}
                <Button onClick={shareLink.openModal}>
                  <Pic className="inline-block align-middle " />
                </Button>
              </span>
            </div>
          )}
        {!props.auto &&
          !props.optionChanged &&
          props.record?.histogram &&
          props.record.count >= 5 && (
            <div className="mb-2" style={{ ...appearingAnimation3(7) }}>
              <p>{t("otherPlayers")}</p>
              <RecordHistogram
                histogram={props.record.histogram}
                bestScoreTotal={props.score100 / 100}
              />
            </div>
          )}
        <div style={{ ...appearingAnimation3(7) }}>
          <Button
            text={t("reset")}
            keyName={props.isTouch ? undefined : "Space"}
            onClick={() => props.reset()}
          />
          <Button
            text={t("exit")}
            keyName={props.isTouch ? undefined : "Esc"}
            onClick={() => props.exit()}
          />
        </div>
      </CenterBox>
      {shareLink.modal}
    </>
  );
}

interface RowProps {
  visible: boolean;
  disabled?: boolean;
  name: string;
  className?: string;
  scoreStyle?: object;
  score100: number;
}
function ResultRow(props: RowProps) {
  return (
    <p
      className={
        "flex flex-row items-baseline " +
        (props.visible ? "" : "opacity-0 ") +
        (props.disabled ? "text-slate-400 dark:text-stone-600 " : "") +
        (props.className || "")
      }
    >
      <span className="flex-1 text-left min-w-0 overflow-visible text-nowrap">
        {props.name}:
      </span>
      <span className="text-3xl text-right " style={props.scoreStyle}>
        {Math.floor(props.score100 / 100)}
      </span>
      <span className="text-xl" style={props.scoreStyle}>
        .
      </span>
      <span className="text-xl text-left w-7 " style={props.scoreStyle}>
        {(props.score100 % 100).toString().padStart(2, "0")}
      </span>
    </p>
  );
}
