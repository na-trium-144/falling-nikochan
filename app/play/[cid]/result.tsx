"use client";

import { CenterBox } from "@/common/box";
import { useEffect, useState } from "react";

interface Props {
  baseScore: number;
  chainScore: number;
  score: number;
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
    }
  }, [])
  return (
    <CenterBox>
      <p>Result</p>
      <p className={"flex flex-row items-baseline " + (showing >= 1 ? "" : "hidden ")}>
        <span className="flex-1 text-left mr-2">Base Score:</span>
        <span className="text-3xl text-right">
          {Math.floor(props.baseScore)}
        </span>
        <span className="">.</span>
        <span className="text-left w-5">
          {(Math.floor(props.baseScore * 100) % 100)
            .toString()
            .padStart(2, "0")}
        </span>
      </p>
      <p className={"flex flex-row items-baseline " + (showing >= 2 ? "" : "hidden ")}>
        <span className="flex-1 text-left mr-2">Chain Score:</span>
        <span className="text-3xl text-right">
          {Math.floor(props.chainScore)}
        </span>
        <span className="">.</span>
        <span className="text-left w-5">
          {(Math.floor(props.chainScore * 100) % 100)
            .toString()
            .padStart(2, "0")}
        </span>
      </p>
      <div className="mt-2 mb-1 border-b border-black" />
      <p className={"flex flex-row items-baseline " + (showing >= 3 ? "" : "hidden ")}>
        <span className="flex-1 text-left mr-2">Total Score:</span>
        <span className="text-3xl text-right">{Math.floor(props.score)}</span>
        <span className="">.</span>
        <span className="text-left w-5">
          {(Math.floor(props.score * 100) % 100).toString().padStart(2, "0")}
        </span>
      </p>
      <p className={"mt-1 flex flex-row items-baseline " + (showing >= 4 ? "" : "hidden ")}>
        <span className="flex-1 text-left">Rank:</span>
        <span className="text-4xl">{rank}</span>
      </p>
    </CenterBox>
  );
}
