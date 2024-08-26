"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  className?: string;
  style?: object;
  score: number;
  best: number;
}
export default function ScoreDisp(props: Props) {
  const { score, best } = props;
  return (
    <div
      className={props.className + " flex flex-col"}
      style={{
        backgroundImage: "url(/cloud.svg)",
        width: 225,
        height: 115,
        paddingLeft: 16,
        paddingRight: 22,
      }}
    >
      <div className="flex flex-row items-baseline mt-1">
        <span className="flex-1 text-md">Score</span>
        <NumDisp num={score} fontSize1={40} fontSize2={24} anim />
      </div>
      <div className="flex flex-row items-baseline">
        <span className="flex-1 text-md mr-2">Best Score</span>
        <NumDisp num={best} fontSize1={24} fontSize2={24} />
      </div>
    </div>
  );
}

interface NumProps {
  num: number;
  fontSize1: number;
  fontSize2: number;
  anim?: boolean;
}
function NumDisp(props: NumProps) {
  const { num } = props;
  const prevNum = useRef<number>(0);
  const [numChanged, setNumChanged] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  useEffect(() => {
    if (num !== prevNum.current) {
      const numChangedNew = numChanged.slice();
      if (
        Math.floor(num / 100) % 10 !==
        Math.floor(prevNum.current / 100) % 10
      ) {
        numChangedNew[0] = true;
      }
      if (
        numChangedNew[0] ||
        Math.floor(num / 10) % 10 !== Math.floor(prevNum.current / 10) % 10
      ) {
        numChangedNew[1] = true;
      }
      if (
        numChangedNew[1] ||
        Math.floor(num / 1) % 10 !== Math.floor(prevNum.current / 1) % 10
      ) {
        numChangedNew[2] = true;
      }
      if (
        numChangedNew[2] ||
        Math.floor(num * 10) % 10 !== Math.floor(prevNum.current * 10) % 10
      ) {
        numChangedNew[3] = true;
      }
      if (
        numChangedNew[3] ||
        Math.floor(num * 100) % 10 !== Math.floor(prevNum.current * 100) % 10
      ) {
        numChangedNew[4] = true;
      }
      prevNum.current = num;
      setNumChanged(numChangedNew);
      setTimeout(() => {
        setNumChanged([false, false, false, false, false]);
      }, 100);
    }
  }, [num, numChanged]);
  return (
    <>
      <div
        className="flex-none text-right"
        style={{ width: 2 * props.fontSize1 }}
      >
        {[100, 10, 1].map((a, i) => (
          <span
            key={i}
            className={
              "inline-block transition duration-100 " +
              (numChanged[i]
                ? "ease-out -translate-y-1"
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
      <span
        className="flex-none inline-block"
        style={{ fontSize: props.fontSize2, lineHeight: 1 }}
      >
        .
      </span>
      <div className="flex-none" style={{ width: 1.4 * props.fontSize2 }}>
        {[10, 100].map((a, i) => (
          <span
            key={a}
            className={
              "inline-block transition duration-100 " +
              (numChanged[i + 3]
                ? "ease-out -translate-y-1"
                : "ease-in translate-y-0")
            }
            style={{
              // width: (28 / 48) * props.fontSize2,
              fontSize: props.fontSize2,
              lineHeight: 1,
            }}
          >
            {Math.floor(num * a) % 10}
          </span>
        ))}
      </div>
    </>
  );
}
