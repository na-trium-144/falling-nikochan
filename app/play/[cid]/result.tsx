"use client";

import { CenterBox } from "@/common/box";
import Button from "@/common/button";
import { Key } from "@/common/key";
import { ReactNode, useEffect, useState } from "react";

interface Props {
  baseScore: number;
  chainScore: number;
  score: number;
  start: () => void;
  exit: () => void;
}
export default function Result(props: Props) {
  const ranks = ["S+", "S", "A+", "A", "B+", "B", "C"];
  let rank: string = "C";
  for (let i = 0; i < ranks.length; i++) {
    if (props.score >= 120 - i * 10 - 0.005) {
      rank = ranks[i];
      break;
    }
  }
  const [showing, setShowing] = useState<number>(0);
  useEffect(() => {
    const t1 = setTimeout(() => setShowing(1), 100);
    const t2 = setTimeout(() => setShowing(2), 600);
    const t3 = setTimeout(() => setShowing(3), 1100);
    const t4 = setTimeout(() => setShowing(4), 1850);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);
  return (
    <CenterBox>
      <p>Result</p>
      <ResultRow visible={showing >= 1} name="Base Score">
        <span className="text-3xl text-right">
          {Math.floor(props.baseScore)}
        </span>
        <span className="">.</span>
        <span className="text-left w-5">
          {(Math.floor(props.baseScore * 100) % 100)
            .toString()
            .padStart(2, "0")}
        </span>
      </ResultRow>
      <ResultRow visible={showing >= 2} name="Chain Bonus">
        <span className="text-3xl text-right">
          {Math.floor(props.chainScore)}
        </span>
        <span className="">.</span>
        <span className="text-left w-5">
          {(Math.floor(props.chainScore * 100) % 100)
            .toString()
            .padStart(2, "0")}
        </span>
      </ResultRow>
      <div className="mt-2 mb-1 border-b border-black" />
      <ResultRow visible={showing >= 3} name="Total Score">
        <span className="text-3xl text-right">{Math.floor(props.score)}</span>
        <span className="">.</span>
        <span className="text-left w-5">
          {(Math.floor(props.score * 100) % 100).toString().padStart(2, "0")}
        </span>
      </ResultRow>
      <ResultRow className="mt-1 mb-3" visible={showing >= 4} name="Rank">
        <span className="text-4xl">{rank}</span>
      </ResultRow>
      <div className="text-center">
        <Button
          text="再スタート"
          keyName="Space"
          onClick={() => props.start()}
        />
        <Button text="やめる" keyName="Esc" onClick={() => props.exit()} />
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
      <span className="flex-1 text-left mr-2">{props.name}:</span>
      {props.children}
    </p>
  );
}
