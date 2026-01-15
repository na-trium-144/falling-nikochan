"use client";

import clsx from "clsx/lite";
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
        width: 225,
        height: 115,
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
        className={clsx(props.className, "absolute")}
        style={{
          left: 16,
          right: 24,
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
  baseScore: number;
  pc: boolean;
  playbackRate: number;
}
export function ScoreDisp(props: Props) {
  const t = useTranslations("play.score");
  const { score, best } = props;
  const lch = useColorWithLerp(props.pc ? props.baseScore / 80 : 0);
  return (
    <Cloud className="flex flex-col">
      <div
        className="relative flex flex-row items-baseline origin-bottom"
        style={{
          marginTop: 14,
          fontSize: 20,
          color: `oklch(${lch[0]} ${lch[1]} ${lch[2]})`,
          transform: `rotate(-1.5deg)`,
        }}
      >
        <span className="flex-1 min-w-0 overflow-visible text-nowrap ">
          {t("score")}
        </span>
        <NumDisp num={score} fontSize1={40} fontSize2={24} anim alignAt2nd />
      </div>
      <SkewedProgressBar
        value={score / 120}
        invertedValue={best / 120}
        borderValues={[70 / 120, 100 / 120]}
      />
      {props.auto && (
        <div
          className="flex justify-center text-nowrap"
          style={{ fontSize: 20, marginTop: 4 }}
        >
          <span className="inline-block">- {t("auto")} -</span>
        </div>
      )}
    </Cloud>
  );
}

function lerp(start: number, end: number, t: number) {
  return start + t * (end - start);
}
function useColorWithLerp(c: number) {
  const factorClip = (c: number) => Math.min(1, Math.max(0, c));
  const lchLight = [
    lerp(0.279, 0.705, factorClip((c - 0.1) / 0.9)),
    lerp(0.041, 0.213, factorClip((c - 0.25) / 0.75)),
    lerp(260.031, 47.604, factorClip(c / 0.25)),
  ];
  const lchDark = [
    lerp(0.869, 0.852, factorClip(c / 0.1)),
    lerp(0.005, 0.199, factorClip((c - 0.1) / 0.9)),
    lerp(56.366, 91.936, factorClip(c / 0.1)),
  ];
  const { isDark } = useTheme();
  return isDark ? lchDark : lchLight;
}
interface ChainProps {
  style?: object;
  chain: number;
  maxChain: number;
  notesTotal: number;
  fc: boolean;
}
// slate-800: oklch(0.279 0.041 260.031); -> orange-500: oklch(0.705 0.213 47.604);
// stone-300: oklch(0.869 0.005 56.366); -> yellow-400: oklch(0.852 0.199 91.936);
export function ChainDisp(props: ChainProps) {
  const t = useTranslations("play.score");
  const lch = useColorWithLerp(props.fc ? props.chain / 100 : 0);
  return (
    <Cloud
      className="flex flex-col"
      left
    >
      <div
        className="relative flex flex-row items-baseline justify-center origin-bottom"
        style={{
          marginTop: 14,
          color: `oklch(${lch[0]} ${lch[1]} ${lch[2]})`,
          transform: `rotate(1.5deg)`,
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
          className="text-left w-18 overflow-visible "
          style={{ fontSize: 20 }}
        >
          {t("chain", { chain: props.chain })}
        </span>
      </div>
      <SkewedProgressBar
        reversed
        value={props.chain / props.notesTotal}
        subValue={props.maxChain / props.notesTotal}
      />
    </Cloud>
  );
}

interface PProps {
  value: number;
  borderValues?: number[];
  invertedValue?: number;
  subValue?: number;
  reversed?: boolean;
}
function SkewedProgressBar(props: PProps) {
  return (
    <div
      className={clsx(
        "absolute rounded-full bg-current/5 shadow-[0_0_0.1em] shadow-current/10",
        "m-auto origin-bottom perspective-origin-bottom"
      )}
      style={{
        zIndex: -1,
        top: 54,
        left: 0,
        right: 0,
        height: 12,
        width: 180,
        transform:
          `perspective(100px) ` +
          `rotateY(${props.reversed ? 15 : -15}deg) ` +
          `translateX(${props.reversed ? 11 : -11}%) ` +
          `translateZ(10px)`,
      }}
    >
      <SkewedProgressBarItem
        value={1}
        className={clsx("border border-slate-300 dark:border-stone-700")}
        reversed={props.reversed}
      />
      {props.borderValues?.map((bv, i) => (
        <SkewedProgressBarItem
          key={i}
          value={bv}
          className={clsx("border border-slate-300 dark:border-stone-700")}
          reversed={props.reversed}
        />
      ))}
      {props.invertedValue !== undefined && (
        <SkewedProgressBarItem
          value={props.invertedValue}
          className={clsx(
            "bg-orange-300/20 border border-orange-300/50",
            "dark:bg-sky-800/20 dark:border-sky-800/50"
          )}
          reversed={props.reversed}
        />
      )}
      <SkewedProgressBarItem
        value={props.subValue ?? props.value}
        className={clsx(
          "bg-sky-300/20 border border-sky-300/50",
          "dark:bg-orange-800/20 dark:border-orange-800/50"
        )}
        reversed={props.reversed}
      />
      <SkewedProgressBarItem
        value={props.value}
        className={clsx(
          "bg-sky-500/20 border border-sky-500/20",
          "dark:bg-orange-600/20 dark:border-orange-600/20"
        )}
        reversed={props.reversed}
      />
    </div>
  );
}
function SkewedProgressBarItem(props: {
  value: number;
  className: string;
  reversed?: boolean;
}) {
  return (
    <div
      className={clsx(
        "absolute inset-y-0 rounded-full",
        "transition-all duration-100",
        props.value <= 0 && "opacity-0",
        props.className
      )}
      style={{
        // ∫[0→w] (1+h)/1.5 dh = (w + w^2/2)/1.5 = value → w^2 + 2w - 3v = 0
        width:
          ((-2 + Math.sqrt(4 + 12 * Math.min(1, props.value))) / 2) * 100 + "%",
        right: props.reversed ? 0 : undefined,
      }}
    />
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
