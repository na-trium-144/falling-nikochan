"use client";

import clsx from "clsx/lite";
import { useTheme } from "@/common/theme";
import { useDisplayMode } from "@/scale.js";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect, useRef, useState } from "react";

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
  notesDone: NoteDone[][];
}
export interface NoteDone {
  id: number;
  indexInStep: number;
  hitTimeSec: number;
  bigDone: boolean;
  done: number;
  baseScore: number;
  chainBonus: number;
  bigBonus: number;
  chain: number;
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
        <span className="flex-1 min-w-0 overflow-visible whitespace-nowrap ">
          {t("score")}
        </span>
        <NumDisp num={score} fontSize1={40} fontSize2={24} anim alignAt2nd />
      </div>
      <SkewedProgressBar
        value={score / 120}
        invertedValue={best / 120}
        borderValues={[70 / 120, 100 / 120]}
        skewedValue={true}
      />
      {props.auto && (
        <div
          className="flex justify-center whitespace-nowrap"
          style={{ fontSize: 20, marginTop: 4 }}
        >
          <span className="inline-block">- {t("auto")} -</span>
        </div>
      )}
      {props.notesDone.map((row) =>
        row.map((nd) => (
          <ScoreDiffAnim key={`${nd.id}-${nd.bigDone}`} nd={nd} />
        ))
      )}
    </Cloud>
  );
}
function ScoreDiffAnim({ nd }: { nd: NoteDone }) {
  const ref = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    ref.current.animate(
      [
        { transform: "translateX(-2.5em) scale(1)", opacity: 0 },
        { transform: "translateX(0) scale(1)", opacity: 1, offset: 0.3 },
        { transform: "translateX(0) scale(1)", opacity: 0.5, offset: 0.8 },
        { transform: "translateX(0) scale(0)", opacity: 0 },
      ],
      { duration: 500, fill: "forwards", easing: "linear" }
    );
  }, []);

  const lch = useColorWithLerp(nd.chain / 100);

  return (
    <div
      ref={ref}
      className={clsx(
        "absolute w-max rounded-full",
        // "backdrop-blur-2xs",
        // "shadow-[0_0_2px_2px]",
        "bg-amber-200/75 shadow-amber-200/75",
        "dark:bg-amber-700/75 dark:shadow-amber-700/75"
      )}
      style={{
        zIndex: 5 - nd.indexInStep,
        top:
          58 + (nd.bigDone ? 0 : 2) + 50 * (Math.sqrt(1 + nd.indexInStep) - 1),
        right: -22 + (nd.bigDone ? 0 : 4 * 2.1),
        fontSize: nd.bigDone ? 24 : 20,
        lineHeight: 1,
        padding: "3px 7px 3px 0.5em",
        transform: "translateX(-3em) scale(1)",
        color: `oklch(${lch[0]} ${lch[1]} ${lch[2]})`,
        opacity: 0,
      }}
    >
      +{Math.floor(nd.baseScore + nd.chainBonus + nd.bigBonus)}.
      <span className="inline-block text-left" style={{ width: "2.1em" }}>
        {(
          Math.floor((nd.baseScore + nd.chainBonus + nd.bigBonus) * 1000) % 1000
        )
          .toString()
          .padStart(3, "0")}
      </span>
    </div>
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
  playing: boolean;
  notesTotal: number;
  fc: boolean;
}
// slate-800: oklch(0.279 0.041 260.031); -> orange-500: oklch(0.705 0.213 47.604);
// stone-300: oklch(0.869 0.005 56.366); -> yellow-400: oklch(0.852 0.199 91.936);
export function ChainDisp(props: ChainProps) {
  const t = useTranslations("play.score");
  const lch = useColorWithLerp(props.fc ? props.chain / 100 : 0);
  return (
    <Cloud className="flex flex-col" left>
      <div
        className="relative flex flex-row items-baseline origin-bottom"
        style={{
          marginTop: 14,
          color: `oklch(${lch[0]} ${lch[1]} ${lch[2]})`,
          transform: `rotate(1.5deg)`,
        }}
      >
        <div className="relative flex-1 flex flex-row items-baseline">
          <span className="flex-3" />
          <span className="z-10">
            <NumDisp
              num={props.chain}
              fontSize1={40}
              fontSize2={null}
              anim
              alignAt2nd
            />
          </span>
          <span className="flex-2" />
          <ChainDropAnim
            className="z-5"
            chain={props.chain}
            playing={props.playing}
          />
          <ChainBigAnim className="z-20" chain={props.chain} />
        </div>
        <span
          className="relative text-center w-max overflow-visible "
          style={{ fontSize: 20 }}
        >
          {/* 幅が変わる可能性がある場合、一番長いもの(chainLong)にあわせる */}
          <span className="invisible">{t("chainLong")}</span>
          <span className="absolute inset-0">
            {t("chain", { chain: props.chain })}
          </span>
        </span>
      </div>
      <SkewedProgressBar
        reversed
        value={props.chain / props.notesTotal}
        subValue={props.maxChain / props.notesTotal}
        skewedValue={false}
      />
    </Cloud>
  );
}
function ChainBigAnim(props: { className: string; chain: number }) {
  const [animChain, setAnimChain] = useState<number>(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const anim = useRef<Animation | undefined>(undefined);
  useEffect(() => {
    if (props.chain < animChain) {
      setAnimChain(0);
      anim.current?.cancel();
    } else if (Math.floor(props.chain / 50) * 50 > animChain) {
      setAnimChain(Math.floor(props.chain / 50) * 50);
      anim.current?.cancel();
      requestAnimationFrame(() => {
        anim.current = ref.current?.animate(
          [
            { transform: "rotate(0) scale(1)", opacity: 1 },
            { transform: "rotate(-3.0deg) scale(4)", opacity: 0 },
          ],
          { duration: 500, fill: "forwards", easing: "ease-out" }
        );
      });
    }
  }, [props.chain, animChain]);
  return (
    <div className={clsx("absolute inset-0 flex flex-row", props.className)}>
      <span className="flex-3" />
      <span
        ref={ref}
        style={{ fontSize: 40, lineHeight: 1, transformOrigin: "40% 40%" }}
      >
        {animChain > 0 ? animChain : ""}
      </span>
      <span className="flex-2" />
    </div>
  );
}
function ChainDropAnim(props: {
  className: string;
  chain: number;
  playing: boolean;
}) {
  const prevChain = useRef<number>(0);
  const prevPlaying = useRef<boolean>(false);
  const [animChain, setAnimChain] = useState<number>(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const anim = useRef<Animation | undefined>(undefined);
  useEffect(() => {
    if (
      props.chain < prevChain.current &&
      prevPlaying.current &&
      props.playing &&
      prevChain.current >= 10
    ) {
      setAnimChain(prevChain.current);
      anim.current?.cancel();
      requestAnimationFrame(() => {
        anim.current = ref.current?.animate(
          [
            { transform: "translateY(0) rotate(0)", opacity: 1 },
            {
              transform: "translateY(1.2em) rotate(-10.0deg)",
              opacity: 0.8,
              offset: 0.8,
            },
            { transform: "translateY(1.5em) rotate(-12.5deg)", opacity: 0 },
          ],
          { duration: 500, fill: "forwards", easing: "ease-out" }
        );
      });
    }
    prevChain.current = props.chain;
    prevPlaying.current = props.playing;
  }, [props.chain, props.playing, animChain]);
  return (
    <div
      className={clsx(
        "absolute inset-0 flex flex-row opacity-50",
        props.className
      )}
    >
      <span className="flex-3" />
      <span
        ref={ref}
        style={{ fontSize: 40, lineHeight: 1, transformOrigin: "40% 40%" }}
      >
        {animChain > 0 ? animChain : ""}
      </span>
      <span className="flex-2" />
    </div>
  );
}

interface PProps {
  value: number;
  borderValues?: number[];
  invertedValue?: number;
  subValue?: number;
  reversed?: boolean;
  skewedValue: boolean;
}
function SkewedProgressBar(props: PProps) {
  const width = 180;
  const perspective = 100;
  const angleDeg = 15;
  const angleRad = angleDeg * (Math.PI / 180);
  const zOffset = (width / 2) * Math.sin(angleRad);
  const zFar = perspective + zOffset;
  const zNear = perspective - zOffset;
  const ratio = zFar / zNear;
  function getPerspectiveLeft(visualLeft: number) {
    if (props.skewedValue) {
      // 意図的に補正せず生の値を渡す
      return visualLeft;
    } else {
      return (visualLeft * ratio) / (visualLeft * ratio + (1 - visualLeft));
    }
  }
  /*const hFar = 1 / zFar;
  const hNear = 1 / zNear;
  function getWidthFromArea(a: number) {
    // ∫[0→w] (hFar+h*(hNear-hFar)) dh = hFar*w + (hNear-hFar)/2*w^2 = area * (hNear+hFar)/2
    return (
      (-hFar + Math.sqrt(hFar * hFar + (hNear - hFar) * (hNear + hFar) * a)) /
      (hNear - hFar)
    );
  }*/
  return (
    <div
      className={clsx(
        "absolute overflow-hidden rounded-full bg-slate-300/15 shadow-[0_0_0.1em] shadow-slate-300/25",
        "dark:bg-stone-500/15 shadow-stone-500/25",
        "m-auto origin-bottom perspective-origin-bottom"
      )}
      style={{
        zIndex: -1,
        top: 54,
        left: 0,
        right: 0,
        height: 12,
        width: width,
        transform:
          `perspective(${perspective}px) ` +
          `rotateY(${props.reversed ? angleDeg : -angleDeg}deg) ` +
          `translateX(${props.reversed ? 11 : -11}%) ` +
          `translateZ(10px)`,
      }}
    >
      <SkewedProgressBarItem
        width={1}
        className={clsx("border border-slate-300 dark:border-stone-500")}
        reversed={props.reversed}
      />
      {props.borderValues?.map((bv, i) => (
        <SkewedProgressBarItem
          key={i}
          width={getPerspectiveLeft(bv)}
          className={clsx("border border-slate-300 dark:border-stone-500")}
          reversed={props.reversed}
        />
      ))}
      {props.invertedValue !== undefined && (
        <SkewedProgressBarItem
          width={getPerspectiveLeft(props.invertedValue)}
          className={clsx(
            "bg-orange-400/20 border border-orange-400/50",
            "dark:bg-sky-600/20 dark:border-sky-600/50"
          )}
          reversed={props.reversed}
        />
      )}
      <SkewedProgressBarItem
        width={getPerspectiveLeft(props.subValue ?? props.value)}
        className={clsx(
          "bg-sky-400/20 border border-sky-400/50",
          "dark:bg-orange-600/20 dark:border-orange-600/50"
        )}
        reversed={props.reversed}
      />
      <SkewedProgressBarItem
        width={getPerspectiveLeft(props.value)}
        className={clsx(
          "bg-sky-500/35 border border-sky-500/35",
          "dark:bg-orange-500/35 dark:border-orange-500/35"
        )}
        reversed={props.reversed}
      />
    </div>
  );
}
function SkewedProgressBarItem(props: {
  width: number;
  className: string;
  reversed?: boolean;
}) {
  return (
    <div
      className={clsx(
        "absolute inset-y-0 rounded-full",
        props.width <= 0 && "opacity-0",
        props.className
      )}
      style={{
        width: Math.min(1, props.width) * 100 + "%",
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
      {[1000, 100, 10, 1].map((a, i) => (
        <span
          key={i}
          ref={numRefs.current[i]}
          className={clsx(
            "inline-block overflow-visible",
            num >= 10 ? "text-left" : "text-center"
          )}
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
