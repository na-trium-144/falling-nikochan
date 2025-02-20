"use client";

import { FourthNote } from "@/common/fourthNote.js";
import { useDisplayMode } from "@/scale.js";
import { useEffect, useRef, useState } from "react";

interface Props {
  currentBpm?: number;
}
export default function BPMSign(props: Props) {
  const { playUIScale } = useDisplayMode();

  const prevBpm = useRef<number | undefined>(undefined);
  const [displayBpm, setDisplayBpm] = useState<number | undefined>(undefined);
  const nextBpm = useRef<number | undefined>(undefined);
  const [flip, setFlip] = useState<boolean>(false);
  useEffect(() => {
    if (nextBpm.current !== undefined) {
      // すでにアニメーションしはじめている
      nextBpm.current = props.currentBpm;
      prevBpm.current = props.currentBpm;
    } else {
      if (
        prevBpm.current !== undefined &&
        props.currentBpm !== undefined &&
        Math.abs(prevBpm.current - props.currentBpm) >= 10
      ) {
        setFlip(true);
        nextBpm.current = props.currentBpm;
        prevBpm.current = props.currentBpm;
        setTimeout(() => {
          setDisplayBpm(nextBpm.current);
          nextBpm.current = undefined;
          setFlip(false);
        }, 100);
      } else {
        setDisplayBpm(props.currentBpm);
        prevBpm.current = props.currentBpm;
      }
    }
  }, [props.currentBpm]);

  return (
    <div
      className="-z-20 absolute origin-bottom-left"
      style={{
        bottom: "100%",
        left: "0.8rem",
        transform: playUIScale !== 1 ? `scale(${playUIScale})` : undefined,
      }}
    >
      <div
        className="absolute inset-0 m-auto w-3 bg-amber-700 dark:bg-amber-900 "
        style={{ borderRadius: "100%/6px" }}
      />
      <div
        className={
          "rounded-sm mb-6 py-1 px-1.5 " +
          "bg-gradient-to-t from-amber-600 to-amber-500 " +
          "dark:from-amber-900 dark:to-amber-800 " +
          "border-b-2 border-r-2 border-amber-800 dark:border-amber-950 " +
          "flex flex-row items-baseline w-27 overflow-hidden " +
          "transition-transform duration-100 " +
          (flip ? "scale-x-0 " : "scale-x-100 ")
        }
      >
        <span className="flex-none text-xl w-max">
          <FourthNote />
          <span className="ml-1.5">=</span>
        </span>
        <span className="flex-1 min-w-0 text-2xl flex flex-row items-baseline justify-end ">
          {displayBpm !== undefined && Math.floor(displayBpm)}
        </span>
        <span className="flex-none text-base w-3.5 overflow-visible">
          .{displayBpm !== undefined && Math.floor(displayBpm * 10) % 10}
        </span>
      </div>
    </div>
  );
}
