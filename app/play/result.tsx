"use client";

import { CenterBox } from "@/common/box";
import Button from "@/common/button";
import { rankStr } from "@/common/rank";
import { ReactNode, useEffect, useState } from "react";

interface Props {
  isTouch: boolean;
  baseScore: number;
  chainScore: number;
  bigScore: number;
  score: number;
  reset: () => void;
  exit: () => void;
}
export default function Result(props: Props) {
  const [showing, setShowing] = useState<number>(0);
  useEffect(() => {
    const t1 = setTimeout(() => setShowing(1), 100);
    const t2 = setTimeout(() => setShowing(2), 600);
    const t3 = setTimeout(() => setShowing(3), 1100);
    const t4 = setTimeout(() => setShowing(4), 1600);
    const t5 = setTimeout(() => setShowing(5), 2350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
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
      <ResultRow visible={showing >= 3} name="Big Note Bonus">
        <span className="text-3xl text-right">
          {Math.floor(props.bigScore)}
        </span>
        <span className="">.</span>
        <span className="text-left w-5">
          {(Math.floor(props.bigScore * 100) % 100).toString().padStart(2, "0")}
        </span>
      </ResultRow>
      <div className="mt-2 mb-1 border-b border-black dark:border-white " />
      <ResultRow visible={showing >= 4} name="Total Score">
        <span className="text-3xl text-right">{Math.floor(props.score)}</span>
        <span className="">.</span>
        <span className="text-left w-5">
          {(Math.floor(props.score * 100) % 100).toString().padStart(2, "0")}
        </span>
      </ResultRow>
      <ResultRow className="mt-1 mb-3" visible={showing >= 5} name="Rank">
        <span className="text-4xl">{rankStr(props.score)}</span>
      </ResultRow>
      <div className="text-center">
        <Button
          text="もう一度"
          keyName={props.isTouch ? undefined : "Space"}
          onClick={() => props.reset()}
        />
        <Button
          text="やめる"
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
      <span className="flex-1 text-left mr-2">{props.name}:</span>
      {props.children}
    </p>
  );
}
