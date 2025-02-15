"use client";

import { CenterBox } from "@/common/box.js";
import Button from "@/common/button.js";
import { rankStr } from "@/common/rank.js";
import { ReactNode, useEffect, useRef, useState } from "react";
import "./result.css";
import {
  baseScoreRate,
  bigScoreRate,
  chainScoreRate,
} from "@/../../chartFormat/gameConstant.js";
import { useTranslations } from "next-intl";

interface Props {
  isTouch: boolean;
  baseScore: number;
  chainScore: number;
  bigScore: number;
  score: number;
  newRecord: number;
  reset: () => void;
  exit: () => void;
  largeResult: boolean;
}
export default function Result(props: Props) {
  const t = useTranslations("play.result");

  const messageRandom = useRef<number>(Math.random());

  const [showing, setShowing] = useState<number>(0);
  useEffect(() => {
    const delay = [100, 500, 500, 500, 750, 750, 750];
    const offset: number[] = [];
    for (let i = 0; i < delay.length; i++) {
      offset.push((i > 0 ? offset[i - 1] : 0) + delay[i]);
    }
    const timers = offset.map((o, i) => setTimeout(() => setShowing(i + 1), o));
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const jumpingAnimation = (index: number) => ({
    animationName: showing >= index ? "result-score-jumping" : undefined,
    animationIterationCount: 1,
    animationDuration: "200ms",
    animationTimingFunction: "linear",
    animationFillMode: "forwards",
  });
  const appearingAnimation = (index: number) => ({
    transitionProperty: "all",
    transitionTimingFunction: "ease-in",
    transitionDuration: "100ms",
    opacity: showing >= index ? 1 : 0,
    transform: showing >= index ? "scale(1)" : "scale(4)",
  });
  const appearingAnimation2 = (index: number) => ({
    transitionProperty: "opacity",
    transitionTimingFunction: "ease-out",
    transitionDuration: "300ms",
    opacity: showing >= index ? 1 : 0,
  });
  return (
    <CenterBox>
      <p className="text-lg font-title font-bold">&lt; {t("result")} &gt;</p>
      <div
        className={
          "my-2 flex justify-center items-center " +
          (props.largeResult ? "flwx-row space-x-2 " : "flex-col space-y-1 ")
        }
      >
        <div className="flex-1 w-56">
          <ResultRow visible={showing >= 1} name={t("baseScore")}>
            <span
              className="text-3xl text-right "
              style={{
                ...jumpingAnimation(1),
              }}
            >
              {Math.floor(props.baseScore)}
            </span>
            <span className="">.</span>
            <span
              className="text-left w-5 "
              style={{
                ...jumpingAnimation(1),
              }}
            >
              {(Math.floor(props.baseScore * 100) % 100)
                .toString()
                .padStart(2, "0")}
            </span>
          </ResultRow>
          <ResultRow visible={showing >= 2} name={t("chainBonus")}>
            <span
              className="text-3xl text-right "
              style={{
                ...jumpingAnimation(2),
              }}
            >
              {Math.floor(props.chainScore)}
            </span>
            <span className="">.</span>
            <span
              className="text-left w-5 "
              style={{
                ...jumpingAnimation(2),
              }}
            >
              {(Math.floor(props.chainScore * 100) % 100)
                .toString()
                .padStart(2, "0")}
            </span>
          </ResultRow>
          <ResultRow visible={showing >= 3} name={t("bigNoteBonus")}>
            <span
              className="text-3xl text-right "
              style={{
                ...jumpingAnimation(3),
              }}
            >
              {Math.floor(props.bigScore)}
            </span>
            <span className="">.</span>
            <span
              className="text-left w-5 "
              style={{
                ...jumpingAnimation(3),
              }}
            >
              {(Math.floor(props.bigScore * 100) % 100)
                .toString()
                .padStart(2, "0")}
            </span>
          </ResultRow>
          <div className="mt-2 mb-1 border-b border-slate-800 dark:border-stone-300" />
          <ResultRow visible={showing >= 4} name={t("totalScore")}>
            <span
              className="text-3xl text-right "
              style={{
                ...jumpingAnimation(4),
              }}
            >
              {Math.floor(props.score)}
            </span>
            <span className="">.</span>
            <span
              className="text-left w-5 "
              style={{
                ...jumpingAnimation(4),
              }}
            >
              {(Math.floor(props.score * 100) % 100)
                .toString()
                .padStart(2, "0")}
            </span>
          </ResultRow>
        </div>
        <div
          className={
            "flex-none w-56 flex flex-col justify-center items-center " +
            (props.largeResult ? "space-y-2 " : "space-y-1 ")
          }
        >
          <div style={{ ...appearingAnimation(5) }}>
            <span className="mr-2">{t("rank")}:</span>
            <span className={props.largeResult ? "text-4xl" : "text-3xl"}>
              {rankStr(props.score)}
            </span>
          </div>
          {props.chainScore === chainScoreRate ? (
            <div
              className={props.largeResult ? "text-2xl" : "text-xl"}
              style={{ ...appearingAnimation(5) }}
            >
              <span className="">
                {props.baseScore === baseScoreRate ? t("perfect") : t("full")}
              </span>
              {props.bigScore === bigScoreRate && (
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
                  (props.score >= 90 ? "A." : props.score >= 70 ? "B." : "C.") +
                  (Math.floor(messageRandom.current * 3) + 1)
              )}
            </div>
          )}
          {props.newRecord > 0 && (
            <div style={{ ...appearingAnimation2(6) }}>
              <span className={props.largeResult ? "text-xl " : ""}>
                {t("newRecord")}
              </span>
              <span className={"ml-1 " + (props.largeResult ? "" : "text-sm")}>
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
      <div className="text-center">
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
  );
}

interface RowProps {
  visible: boolean;
  name: string;
  children: ReactNode | ReactNode[];
  className?: string;
}
function ResultRow(props: RowProps) {
  return (
    <p
      className={
        "flex flex-row items-baseline " +
        (props.visible ? "" : "opacity-0 ") +
        (props.className || "")
      }
    >
      <span className="flex-1 text-left min-w-0 overflow-visible text-nowrap">
        {props.name}:
      </span>
      {props.children}
    </p>
  );
}
