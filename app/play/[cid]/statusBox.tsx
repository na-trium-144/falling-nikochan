"use client";

import { Box } from "@/common/box";
import { Key } from "@/common/key";
import { useDisplayMode } from "@/scale";
import { ReactNode } from "react";

interface Props {
  className?: string;
  judgeCount: number[];
  bigCount: number;
  bigTotal: number;
  notesTotal: number;
  isMobile: boolean;
  isTouch: boolean;
}
export default function StatusBox(props: Props) {
  const { screenWidth, screenHeight, rem } = useDisplayMode();
  const isMobile = screenWidth < screenHeight;
  let boxScale: number = 1;
  let textScale: number = 1;
  if (isMobile) {
    textScale = Math.min(screenWidth / (31 * rem), 1);
  } else {
    // 計算めんどくなって適当に数字入れてでっちあげしている
    boxScale = Math.min(
      (screenHeight - screenWidth * (1 / 3) * (2 / 3) - 7 * rem) / (17 * rem),
      1
    );
  }

  return (
    <Box
      className={props.className + (isMobile ? "" : " origin-top-right")}
      style={{
        transform: boxScale < 1 ? `scale(${boxScale})` : undefined,
        padding: (3 / 4) * rem * boxScale,
        fontSize: textScale * rem,
      }}
    >
      <div
        className={
          props.isMobile
            ? "flex flex-row h-full items-center justify-between "
            : "w-56"
        }
      >
        {["Good", "OK", "Bad", "Miss"].map((name, ji) => (
          <StatusItem key={ji}>
            <StatusName>{name}</StatusName>
            <StatusValue>{props.judgeCount[ji]}</StatusValue>
          </StatusItem>
        ))}
        <StatusItem wide>
          <StatusName>{props.isMobile ? "Big" : "Big Notes"}</StatusName>
          <StatusValue>{props.bigCount}</StatusValue>
          {!props.isMobile && (
            <span className="w-12 pl-1 flex flex-row items-baseline">
              <span className="flex-1">/</span>
              <span>{props.bigTotal}</span>
            </span>
          )}
        </StatusItem>
        {props.isMobile && screenWidth >= 39 * rem && (
          <span className="flex-none w-12 pl-1 self-end translate-y-1 flex flex-row items-baseline mr-2">
            <span className="flex-1">/</span>
            <span>{props.bigTotal}</span>
          </span>
        )}
        <StatusItem wide>
          <StatusName>Remains</StatusName>
          <StatusValue>
            {props.notesTotal - props.judgeCount.reduce((sum, j) => sum + j, 0)}
          </StatusValue>
          {!props.isMobile && (
            <span className="w-12 pl-1 flex flex-row items-baseline">
              <span className="flex-1">/</span>
              <span>{props.notesTotal}</span>
            </span>
          )}
        </StatusItem>
        {props.isMobile && screenWidth >= 35 * rem && (
          <span className="flex-none w-12 pl-1 self-end translate-y-1 flex flex-row items-baseline">
            <span className="flex-1">/</span>
            <span>{props.notesTotal}</span>
          </span>
        )}
      </div>
    </Box>
  );
}

function StatusItem(props: { wide?: boolean; children: ReactNode[] }) {
  const { screenWidth, screenHeight, rem } = useDisplayMode();
  const isMobile = screenWidth < screenHeight;
  return (
    <div
      className={
        isMobile
          ? "flex-1 basis-1 flex flex-col mr-2"
          : "flex flex-row items-baseline " + (props.wide ? "" : "mr-12")
      }
      style={{
        fontSize: isMobile ? "0.8em" : undefined,
        lineHeight: isMobile ? 1 : undefined,
      }}
    >
      {props.children}
    </div>
  );
}
function StatusName(props: { children: ReactNode }) {
  const { screenWidth, screenHeight, rem } = useDisplayMode();
  const isMobile = screenWidth < screenHeight;
  return <span className={isMobile ? "h-3 " : "flex-1"}>{props.children}</span>;
}
function StatusValue(props: { children: ReactNode }) {
  const { screenWidth, screenHeight, rem } = useDisplayMode();
  const isMobile = screenWidth < screenHeight;
  return (
    <span
      className="text-right mt-1"
      style={{
        fontSize: "2em",
        lineHeight: 1,
      }}
    >
      {props.children}
    </span>
  );
}
