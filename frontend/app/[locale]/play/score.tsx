"use client";

import { ThemeContext } from "@/common/theme";
import { useDisplayMode } from "@/scale.js";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect, useRef, useState } from "react";

interface CProps {
  className?: string;
  left?: boolean;
  children: ReactNode;
  theme: ThemeContext;
}
function Cloud(props: CProps) {
  const { playUIScale } = useDisplayMode();

  return (
    <div
      className={
        "absolute top-0 " +
        (props.left ? "left-3 origin-top-left" : "right-3 origin-top-right")
      }
      style={{
        transform: `scale(${playUIScale * 0.8})`,
      }}
    >
      <img
        src={
          process.env.ASSET_PREFIX +
          (props.theme.isDark ? "/assets/cloud-black.svg" : "/assets/cloud.svg")
        }
        className="absolute inset-0 -z-10 "
      />
      <div
        className={props.className}
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
  theme: ThemeContext;
}
export function ScoreDisp(props: Props) {
  const t = useTranslations("play.score");
  const { score, best } = props;
  return (
    <Cloud className="flex flex-col" theme={props.theme}>
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
        <div className="text-center mt-1 " style={{ fontSize: 20 }}>
          &lt;&lt; {t("auto")} &gt;&gt;
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
  theme: ThemeContext;
}
// slate-800: oklch(0.279 0.041 260.031); -> orange-500: oklch(0.705 0.213 47.604);
// stone-300: oklch(0.869 0.005 56.366); -> yellow-400: oklch(0.852 0.199 91.936);
export function ChainDisp(props: ChainProps) {
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
      className={
        "flex flex-col " +
        (props.chain >= 100 ? "text-orange-500 dark:text-yellow-400 " : "")
      }
      theme={props.theme}
      left
    >
      <div
        className="flex flex-row items-baseline justify-center "
        style={{
          marginTop: 20,
          color: props.theme.isDark
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
  const [numChanged, setNumChanged] = useState<boolean[]>(
    Array.from(new Array(digits)).map(() => false)
  );
  useEffect(() => {
    if (anim && num > prevNum.current) {
      const numChangedNew = numChanged.slice();
      let a = 1000;
      for (let i = 0; i < digits; i++) {
        if (
          (i >= 1 && numChangedNew[i - 1]) ||
          Math.floor(num / a) % 10 !== Math.floor(prevNum.current / a) % 10
        ) {
          numChangedNew[i] = true;
        }
        a /= 10;
      }
      setNumChanged(numChangedNew);
      setTimeout(() => {
        setNumChanged(Array.from(new Array(digits)).map(() => false));
      }, 100);
    }
    prevNum.current = num;
  }, [num, numChanged, anim]);
  return (
    <>
      <div className="text-right">
        {[1000, 100, 10, 1].map((a, i) => (
          <span
            key={i}
            className={
              "inline-block overflow-visible text-left transition duration-100 " +
              (numChanged[i]
                ? "ease-out -translate-y-1/4"
                : "ease-in translate-y-0")
            }
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
                className={
                  "inline-block transition duration-100 " +
                  (numChanged[i + digits - 2]
                    ? "ease-out -translate-y-1/4"
                    : "ease-in translate-y-0")
                }
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
