"use client";

import { useDisplayMode } from "@/scale";

interface Props {
  currentBpm?: number;
}
export default function BPMSign(props: Props) {
  const { screenWidth, screenHeight } = useDisplayMode();
  const isMobile = screenWidth < screenHeight;
  const scalingWidthThreshold = isMobile ? 500 : 750;
  const scale = Math.min(screenWidth / scalingWidthThreshold, 1);

  return (
    <div
      className="-z-10 absolute origin-bottom-left"
      style={{
        bottom: "100%",
        left: "1rem",
        transform: scale < 1 ? `scale(${scale})` : undefined,
      }}
    >
      <div
        className="absolute inset-0 m-auto w-4 bg-amber-800 "
        style={{ borderRadius: "100%/6px" }}
      ></div>
      <div
        className={
          "rounded-sm -translate-y-10 p-2 " +
          "bg-gradient-to-t from-amber-700 to-amber-600 " +
          "border-b-2 border-r-2 border-amber-900 " +
          "flex flex-row items-baseline"
        }
      >
        <span className="text-2xl font-title">♩</span>
        <span className="text-xl ml-2 mr-1">=</span>
        <span className="text-right text-3xl w-16">
          {props.currentBpm !== undefined && Math.floor(props.currentBpm)}
        </span>
        <span className="text-lg">.</span>
        <span className="text-lg w-3">
          {props.currentBpm !== undefined &&
            Math.floor(props.currentBpm * 10) % 10}
        </span>
      </div>
    </div>
  );
}
