"use client";

import { Box } from "@/common/box.js";
import { useDisplayMode } from "@/scale.js";
import DisappointedFace from "@icon-park/react/lib/icons/DisappointedFace";
import DistraughtFace from "@icon-park/react/lib/icons/DistraughtFace";
import GrinningFaceWithTightlyClosedEyesOpenMouth from "@icon-park/react/lib/icons/GrinningFaceWithTightlyClosedEyesOpenMouth";
import SmilingFace from "@icon-park/react/lib/icons/SmilingFace";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

interface Props {
  className?: string;
  style?: object;
  judgeCount: number[];
  bigCount: number;
  bigTotal: number;
  notesTotal: number;
  isMobile: boolean;
  isTouch: boolean;
}
export default function StatusBox(props: Props) {
  const t = useTranslations("play.status");
  const { screenWidth, screenHeight, rem, mobileStatusScale } =
    useDisplayMode();
  const isMobile = screenWidth < screenHeight;
  const textScale = isMobile ? mobileStatusScale : 0.8;

  return (
    <Box
      className={
        props.className + " p-3 " + (isMobile ? "" : " origin-top-right")
      }
      style={{
        ...props.style,
        fontSize: textScale * rem,
      }}
    >
      <div
        className={
          props.isMobile
            ? "flex flex-row h-full items-center justify-between "
            : "w-48"
        }
      >
        {["good", "ok", "bad", "miss"].map((name, ji) => (
          <StatusItem key={ji}>
            <StatusName>
              <StatusIcon index={ji} />
              {t(name)}
            </StatusName>
            <StatusValue>{props.judgeCount[ji]}</StatusValue>
          </StatusItem>
        ))}
        <StatusItem wide disabled={props.bigTotal === 0}>
          <StatusName>{t("big")}</StatusName>
          <StatusValue>{props.bigCount}</StatusValue>
          {!props.isMobile && (
            <span className="w-12 pl-1 flex flex-row items-baseline">
              <span className="flex-1">/</span>
              <span>{props.bigTotal}</span>
            </span>
          )}
        </StatusItem>
        {props.isMobile && screenWidth >= 39 * rem && (
          <span
            className={
              "flex-none w-12 pl-1 self-end translate-y-1 flex flex-row items-baseline mr-2 " +
              (props.bigTotal === 0
                ? "text-slate-400 dark:text-stone-600 "
                : "")
            }
          >
            <span className="flex-1">/</span>
            <span>{props.bigTotal}</span>
          </span>
        )}
        <StatusItem wide>
          <StatusName>{t("remains")}</StatusName>
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

function StatusItem(props: {
  wide?: boolean;
  children: ReactNode[];
  disabled?: boolean;
}) {
  const { screenWidth, screenHeight } = useDisplayMode();
  const isMobile = screenWidth < screenHeight;
  return (
    <div
      className={
        (isMobile
          ? "flex-1 basis-1 flex flex-col mr-2 "
          : "flex flex-row items-baseline " + (props.wide ? "" : "mr-12 ")) +
        (props.disabled ? "text-slate-400 dark:text-stone-600 " : "")
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
function StatusIcon(props: { index: number }) {
  return (
    <span
      className="inline-block relative "
      style={{ width: "1.25em", fontSize: "1.25em" }}
    >
      <span className="absolute bottom-0 left-0 translate-y-0.5 ">
        <JudgeIcon index={props.index} />
      </span>
    </span>
  );
}
export function JudgeIcon(props: { index: number }) {
  return (
    <>
      {props.index === 0 ? (
        <GrinningFaceWithTightlyClosedEyesOpenMouth />
      ) : props.index === 1 ? (
        <SmilingFace />
      ) : props.index === 2 ? (
        <DisappointedFace />
      ) : (
        <DistraughtFace />
      )}
    </>
  );
}
function StatusName(props: { children: ReactNode }) {
  const { screenWidth, screenHeight } = useDisplayMode();
  const isMobile = screenWidth < screenHeight;
  return (
    <span className={isMobile ? "h-max w-max" : "flex-1"}>
      {props.children}
    </span>
  );
}
function StatusValue(props: { children: ReactNode }) {
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
