"use client";

import { FourthNote } from "@/common/fourthNote";
import { useDisplayMode } from "@/scale";
import { useEffect, useRef, useState } from "react";

interface Props {
  currentBpm?: number;
}
export default function BPMSign(props: Props) {
  const { playUIScale } = useDisplayMode();

  const prevBpm = useRef<number | undefined>(undefined);
  const displayedBpm = useRef<number | undefined>(undefined);
  const [flip, setFlip] = useState<boolean>(false);
  useEffect(() => {
    if (
      prevBpm.current !== undefined &&
      props.currentBpm !== undefined &&
      Math.abs(prevBpm.current - props.currentBpm) >= 10
    ) {
      setFlip(true);
      setTimeout(() => {
        displayedBpm.current = props.currentBpm;
        setFlip(false);
      }, 100);
    } else {
      displayedBpm.current = props.currentBpm;
    }
    prevBpm.current = props.currentBpm;
  }, [props.currentBpm]);

  return (
    <div
      className="-z-10 absolute origin-bottom-left"
      style={{
        bottom: "100%",
        left: "0.8rem",
        transform: playUIScale !== 1 ? `scale(${playUIScale})` : undefined,
      }}
    >
      <div
        className="absolute inset-0 m-auto w-3 bg-amber-700 "
        style={{ borderRadius: "100%/6px" }}
      />
      <div
        className={
          "rounded-sm mb-6 py-1 px-1.5 " +
          "bg-gradient-to-t from-amber-600 to-amber-500 " +
          "border-b-2 border-r-2 border-amber-800 " +
          "flex flex-row items-baseline " +
          "transition-transform duration-100 " +
          (flip ? "scale-x-0 " : "scale-x-100 ")
        }
      >
        <span className="text-xl "><FourthNote /></span>
        <span className="text-xl ml-1.5 mr-1">=</span>
        <span className="text-right text-2xl w-auto min-w-12">
          {displayedBpm.current !== undefined &&
            Math.floor(displayedBpm.current)}
        </span>
        <span className="text-base">.</span>
        <span className="text-base w-2.5 overflow-visible">
          {displayedBpm.current !== undefined &&
            Math.floor(displayedBpm.current * 10) % 10}
        </span>
      </div>
    </div>
  );
}
