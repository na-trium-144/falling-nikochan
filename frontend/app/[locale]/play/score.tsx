"use client";

import clsx from "clsx";
import { useTheme } from "@/common/theme";
import { useDisplayMode } from "@/scale.js";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect, useRef } from "react";

interface CProps {
  className?: string;
  left?: boolean;
  children: ReactNode;
}
function Cloud(props: CProps) {
  const themeState = useTheme();
  const { playUIScale } = useDisplayMode();

  return (
    <div
      className={clsx(
        "absolute top-0",
        props.left ? "origin-top-left" : "origin-top-right"
      )}
      style={{
        left: props.left ? 0.75 * playUIScale + "rem" : undefined,
        right: props.left ? undefined : 0.75 * playUIScale + "rem",
        transform: `scale(${playUIScale * 0.8})`,
      }}
    >
      <img
        src={
          process.env.ASSET_PREFIX +
          (themeState.isDark ? "/assets/cloud-black.svg" : "/assets/cloud.svg")
        }
        className="absolute inset-0 -z-10 "
      />
      <div
        className={clsx(props.className)}
        style={{
          width: 225,
          height: 115,
          paddingLeft: 16,
          paddingRight: 22,
        }}
      >
        {props.children}
      </div>
    </div>
  );
}
interface Props {
  style?: object;
  score: number;
  best: number;
  auto: boolean;
  playbackRate: number;
}
export function ScoreDisp(props: Props) {
  const t = useTranslations("play.score");
  const { score, best } = props;
  return (
    <Cloud className="flex flex-col">
      <div
        className="flex flex-row items-baseline"
        style={{ marginTop: 4, fontSize: 16 }}
      >
        <span className="flex-1 min-w-0 overflow-visible text-nowrap ">
          {t("score")}
        </span>
        <NumDisp num={score} fontSize1={40} fontSize2={24} anim alignAt2nd />
      </div>
      {props.auto ? (
        <>
          <div className="text-center mt-1 " style={{ fontSize: 20 }}>
            &lt;&lt; {t("auto")} &gt;&gt;
          </div>
          {props.playbackRate !== 1 && (
            <span
              className="text-center"
              style={{ fontSize: 24, marginTop: -4, marginRight: "30%" }}
            >
              ×{props.playbackRate}
            </span>
          )}
        </>
      ) : props.playbackRate !== 1 ? (
        <div className="text-center ">
          <span style={{ fontSize: 16, marginRight: 8 }}>
            {t("playbackRate")}:
          </span>
          <span style={{ fontSize: 24 }}>×{props.playbackRate}</span>
        </div>
      ) : (
        <div className="flex flex-row items-baseline" style={{ marginTop: 4 }}>
          <span
            className="flex-1 min-w-0 overflow-visible text-nowrap "
            style={{ fontSize: 16, marginRight: 8 }}
          >
            {t("bestScore")}
          </span>
          <NumDisp num={best} fontSize1={24} fontSize2={24} />
        </div>
      )}
    </Cloud>
  );
}

function lerp(start: number, end: number, t: number) {
  return start + t * (end - start);
}
interface ChainProps {
  style?: object;
  chain: number;
  fc: boolean;
}
// slate-800: oklch(0.279 0.041 260.031); -> orange-500: oklch(0.705 0.213 47.604);
// stone-300: oklch(0.869 0.005 56.366); -> yellow-400: oklch(0.852 0.199 91.936);
export function ChainDisp(props: ChainProps) {
  const themeState = useTheme();
  const t = useTranslations("play.score");
  const factorClip = (c: number) =>
    props.fc ? Math.min(1, Math.max(0, c)) : 0;
  const lchLight = [
    lerp(0.279, 0.705, factorClip((props.chain - 10) / 90)),
    lerp(0.041, 0.213, factorClip((props.chain - 25) / 75)),
    lerp(260.031, 47.604, factorClip(props.chain / 25)),
  ];
  const lchDark = [
    lerp(0.869, 0.852, factorClip(props.chain / 100)),
    lerp(0.005, 0.199, factorClip((props.chain - 10) / 90)),
    lerp(56.366, 91.936, factorClip(props.chain / 10)),
  ];
  return (
    <Cloud
      className={clsx(
        "flex flex-col",
        props.chain >= 100 ? "text-orange-500 dark:text-yellow-400" : ""
      )}
      left
    >
      <div
        className="flex flex-row items-baseline justify-center "
        style={{
          marginTop: 20,
          color: themeState.isDark
            ? `oklch(${lchDark[0]} ${lchDark[1]} ${lchDark[2]})`
            : `oklch(${lchLight[0]} ${lchLight[1]} ${lchLight[2]})`,
        }}
      >
        <span style={{ width: 112, marginRight: 8 }}>
          <NumDisp
            num={props.chain}
            fontSize1={40}
            fontSize2={null}
            anim
            alignAt2nd
          />
        </span>
        <span
          className="text-left w-14 overflow-visible "
          style={{ fontSize: 16 }}
        >
          {t("chain", { chain: props.chain })}
        </span>
      </div>
    </Cloud>
  );
}

interface NumProps {
  num: number;
  fontSize1: number;
  fontSize2: number | null;
  anim?: boolean;
  alignAt2nd?: boolean;
}
const digits = 6;
function NumDisp(props: NumProps) {
  const { num, anim } = props;
  const prevNum = useRef<number>(0);
  const numRefS100 = useRef<HTMLSpanElement | null>(null);
  const numRefS10 = useRef<HTMLSpanElement | null>(null);
  const numRef1 = useRef<HTMLSpanElement | null>(null);
  const numRef10 = useRef<HTMLSpanElement | null>(null);
  const numRef100 = useRef<HTMLSpanElement | null>(null);
  const numRef1000 = useRef<HTMLSpanElement | null>(null);
  const numRefs = useRef([
    numRef1000,
    numRef100,
    numRef10,
    numRef1,
    numRefS10,
    numRefS100,
  ]);
  const numAnimations = useRef<(Animation | undefined)[]>(
    new Array(digits).fill(undefined)
  );
  useEffect(() => {
    if (anim && num > prevNum.current) {
      const numChanged = new Array(digits).fill(false);
      let a = 1000;
      for (let i = 0; i < digits; i++) {
        if (
          (i >= 1 && numChanged[i - 1]) ||
          Math.floor(num / a) % 10 !== Math.floor(prevNum.current / a) % 10
        ) {
          numChanged[i] = true;
          numAnimations.current[i]?.cancel();
          numAnimations.current[i] = numRefs.current[i].current?.animate(
            [
              { transform: "translateY(0)" },
              { transform: "translateY(-25%)", offset: 0.3 },
              { transform: "translateY(0)" },
            ],
            { duration: 200, fill: "forwards", easing: "linear" }
          );
        }
        a /= 10;
      }
    }
    prevNum.current = num;
  }, [num, anim]);
  return (
    <>
      <div className="text-right">
        {[1000, 100, 10, 1].map((a, i) => (
          <span
            key={i}
            ref={numRefs.current[i]}
            className="inline-block overflow-visible text-left "
            style={{
              width:
                a === 1 && props.alignAt2nd
                  ? (32 / 48) * props.fontSize1
                  : undefined,
              fontSize: props.fontSize1,
              lineHeight: 1,
            }}
          >
            {(a == 1 || num >= a) && Math.floor(num / a) % 10}
          </span>
        ))}
      </div>
      {props.fontSize2 && (
        <>
          <span
            className="inline-block"
            style={{ fontSize: props.fontSize2, lineHeight: 1 }}
          >
            .
          </span>
          <div
            className="flex flex-row "
            style={{ width: 1.4 * props.fontSize2 }}
          >
            {[10, 100].map((a, i) => (
              <span
                key={a}
                ref={numRefs.current[i + digits - 2]}
                className="inline-block "
                style={{
                  // width: (32 / 48) * props.fontSize2!,
                  fontSize: props.fontSize2!,
                  lineHeight: 1,
                }}
              >
                {Math.floor(num * a) % 10}
              </span>
            ))}
          </div>
        </>
      )}
    </>
  );
}
