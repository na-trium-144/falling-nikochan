"use client";

import { useDisplayMode } from "@/scale";
import { ReactNode, useEffect, useRef, useState } from "react";

interface CProps {
  className?: string;
  left?: boolean;
  children: ReactNode;
}
function Cloud(props: CProps) {
  const { screenWidth, screenHeight } = useDisplayMode();
  const isMobile = screenWidth < screenHeight;
  const scalingWidthThreshold = isMobile ? 500 : 750;
  const scale = Math.min(screenWidth / scalingWidthThreshold, 1);

  return (
    <div
      className={
        "absolute top-0 " +
        (props.left ? "left-3 origin-top-left" : "right-3 origin-top-right")
      }
      style={{
        transform: scale < 1 ? `scale(${scale})` : undefined,
      }}
    >
      <div
        className={props.className}
        style={{
          backgroundImage: "url(/cloud.svg)",
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
}
export function ScoreDisp(props: Props) {
  const { score, best } = props;
  return (
    <Cloud className="flex flex-col">
      <div className="flex flex-row items-baseline" style={{ marginTop: 4 }}>
        <span className="flex-1 text-md">Score</span>
        <NumDisp num={score} fontSize1={40} fontSize2={24} anim />
      </div>
      {props.auto ? (
        <div className="text-center">&lt;&lt; AutoPlay &gt;&gt;</div>
      ) : (
        <div className="flex flex-row items-baseline" style={{ marginTop: 4 }}>
          <span className="flex-1 " style={{ fontSize: 16, marginRight: 8 }}>
            Best Score
          </span>
          <NumDisp num={best} fontSize1={24} fontSize2={24} />
        </div>
      )}
    </Cloud>
  );
}
interface ChainProps {
  style?: object;
  chain: number;
}
export function ChainDisp(props: ChainProps) {
  return (
    <Cloud
      className={
        "flex flex-col " + (props.chain >= 100 ? "text-orange-500 " : "")
      }
      left
    >
      <div
        className="flex flex-row items-baseline justify-center "
        style={{ marginTop: 20 }}
      >
        <span className="" style={{ width: 112, marginRight: 8 }}>
          <NumDisp num={props.chain} fontSize1={40} fontSize2={null} anim />
        </span>
        <span className="text-left " style={{ fontSize: 16 }}>
          Chains
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
              "inline-block transition duration-100 " +
              (numChanged[i]
                ? "ease-out -translate-y-1/4"
                : "ease-in translate-y-0")
            }
            style={{
              // width: (28 / 48) * props.fontSize1,
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
                  // width: (28 / 48) * props.fontSize2,
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
