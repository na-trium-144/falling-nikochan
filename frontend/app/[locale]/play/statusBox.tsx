"use client";

import clsx from "clsx/lite";
import {
  Box,
} from "@/common/box.js";
import { useDisplayMode } from "@/scale.js";
import DisappointedFace from "@icon-park/react/lib/icons/DisappointedFace";
import DistraughtFace from "@icon-park/react/lib/icons/DistraughtFace";
import GrinningFaceWithTightlyClosedEyesOpenMouth from "@icon-park/react/lib/icons/GrinningFaceWithTightlyClosedEyesOpenMouth";
import SmilingFace from "@icon-park/react/lib/icons/SmilingFace";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import {
  invertedFlatButtonBorderStyle1,
  invertedFlatButtonBorderStyle2,
} from "@/common/flatButton";

interface Props {
  className?: string;
  style?: object;
  judgeCount: number[];
  bigCount: number;
  bigTotal: number;
  notesTotal: number;
  isMobile: boolean;
  isTouch: boolean;
  best: number;
  bestCount: number[] | null;
  showBestScore: boolean;
  countMode: "bestCount" | "grayZero" | "judge";
  showResultDiff: boolean;
}
export default function StatusBox(props: Props) {
  const t = useTranslations("play.status");
  const { screenWidth, screenHeight, rem, mobileStatusScale } =
    useDisplayMode();
  const isMobile = screenWidth < screenHeight;
  const textScale = isMobile ? mobileStatusScale : 0.8;

  return (
    <Box
      classNameOuter={clsx(
        props.className,
        "overflow-visible!",
        isMobile ? "origin-top-right" : "w-54"
      )}
      classNameInner={clsx(
        props.isMobile
          ? "relative flex flex-row items-center justify-between"
          : ""
      )}
      styleOuter={{
        ...props.style,
        fontSize: textScale * rem,
        padding: isMobile ? "0.75em" : "1rem",
      }}
    >
      {props.showBestScore && (
        <div
          className={clsx(
            isMobile
              ? clsx("absolute left-[10%] top-[-2em]")
              : clsx("relative"),
            "flex flex-row items-baseline",
            "w-max m-auto px-2 py-0.5 mb-1 rounded-lg",
            "shadow-xs z-3",
            props.bestCount
              ? clsx(
                  // invertedFlatButtonStyle,
                  "backdrop-blur-xs",
                  "bg-orange-200/50 dark:bg-sky-800/50",
                  "inset-shadow-button inset-shadow-orange-300/50 dark:inset-shadow-sky-975/75"
                )
              : clsx("fn-plain", "text-slate-500/75 dark:text-stone-400/75")
          )}
          style={{
            fontSize: isMobile ? "0.8em" : undefined,
          }}
        >
          <span
            className={clsx(
              props.bestCount
                ? invertedFlatButtonBorderStyle1
                : "fn-glass-1",
              "opacity-100!"
            )}
          />
          <span
            className={clsx(
              props.bestCount
                ? invertedFlatButtonBorderStyle2
                : "fn-glass-2",
              "opacity-100!"
            )}
          />
          <span>{t("bestScore")}:</span>
          <span
            className="inline-block text-right"
            style={{
              width: "2.2em",
              fontSize: "1.8em",
              lineHeight: 1,
            }}
          >
            {Math.floor(props.best)}
          </span>
          <span
            className="inline-block"
            style={{ width: "1.6em", fontSize: "1.2em" }}
          >
            .{(Math.floor(props.best * 100) % 100).toString().padStart(2, "0")}
          </span>
        </div>
      )}
      {["good", "ok", "bad", "miss"].map((name, ji) => (
        <StatusItem
          wide={!isMobile && props.showResultDiff && !!props.bestCount}
          key={ji}
        >
          <StatusName>
            <StatusIcon index={ji} />
            {t(name)}
          </StatusName>
          {props.countMode === "bestCount" && props.bestCount ? (
            <StatusValue color="inverted">{props.bestCount[ji]}</StatusValue>
          ) : props.countMode === "bestCount" ||
            props.countMode === "grayZero" ? (
            <StatusValue color="gray">{0}</StatusValue>
          ) : props.countMode === "judge" ? (
            <StatusValue>{props.judgeCount[ji]}</StatusValue>
          ) : (
            (props.countMode satisfies never)
          )}
          {!isMobile && props.showResultDiff && props.bestCount && (
            <span
              className={clsx(
                "inline-block w-12 pl-1 text-center",
                "text-orange-400/75 dark:text-sky-500/75"
              )}
              style={{ fontSize: "1.2em", lineHeight: 1 }}
            >
              {props.judgeCount[ji] !== props.bestCount[ji] && (
                <>
                  <span className="mr-0.5">
                    {props.judgeCount[ji] > props.bestCount[ji] ? "+" : "-"}
                  </span>
                  <span>
                    {Math.abs(props.judgeCount[ji] - props.bestCount[ji])}
                  </span>
                </>
              )}
            </span>
          )}
        </StatusItem>
      ))}
      <StatusItem wide disabled={props.bigTotal === 0}>
        <StatusName>{t("big")}</StatusName>
        {props.countMode === "bestCount" && props.bestCount ? (
          <StatusValue disabled={props.bigTotal === 0} color="inverted">
            {props.bestCount[4]}
          </StatusValue>
        ) : props.countMode === "bestCount" ||
          props.countMode === "grayZero" ? (
          <StatusValue disabled={props.bigTotal === 0} color="gray">
            {0}
          </StatusValue>
        ) : props.countMode === "judge" ? (
          <StatusValue disabled={props.bigTotal === 0}>
            {props.bigCount}
          </StatusValue>
        ) : (
          (props.countMode satisfies never)
        )}
        {!props.isMobile &&
          (props.showResultDiff && props.bestCount && props.bigTotal !== 0 ? (
            <span
              className={clsx(
                "inline-block w-12 pl-1 text-center",
                "text-orange-400/75 dark:text-sky-500/75"
              )}
              style={{ fontSize: "1.2em", lineHeight: 1 }}
            >
              {props.bigCount !== props.bestCount[4] && (
                <>
                  <span className="mr-0.5">
                    {props.bigCount > props.bestCount[4] ? "+" : "-"}
                  </span>
                  <span>{Math.abs(props.bigCount - props.bestCount[4])}</span>
                </>
              )}
            </span>
          ) : (
            <span className="w-12 pl-1 flex flex-row items-baseline">
              <span className="flex-1">/</span>
              <span>{props.bigTotal}</span>
            </span>
          ))}
      </StatusItem>
      {props.isMobile && screenWidth >= 39 * rem && (
        <span
          className={clsx(
            "flex-none w-12 self-end translate-y-1 flex flex-row items-baseline mr-2",
            props.bigTotal === 0 && "text-slate-400 dark:text-stone-600"
          )}
        >
          <span className="flex-1">/</span>
          <span>{props.bigTotal}</span>
        </span>
      )}
      <StatusItem wide>
        <StatusName>{t("remains")}</StatusName>
        {props.countMode !== "judge" ? (
          <StatusValue color="gray">-</StatusValue>
        ) : (
          <StatusValue>
            {props.notesTotal - props.judgeCount.reduce((sum, j) => sum + j, 0)}
          </StatusValue>
        )}
        {!props.isMobile && (
          <span className="w-12 pl-1 flex flex-row items-baseline">
            <span className="flex-1">/</span>
            <span>{props.notesTotal}</span>
          </span>
        )}
      </StatusItem>
      {props.isMobile && screenWidth >= 35 * rem && (
        <span className="flex-none w-12 self-end translate-y-1 flex flex-row items-baseline">
          <span className="flex-1">/</span>
          <span>{props.notesTotal}</span>
        </span>
      )}
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
      className={clsx(
        isMobile
          ? "flex-1 basis-1 flex flex-col"
          : clsx("flex flex-row items-baseline", props.wide || "mr-12"),
        props.disabled && "text-slate-400/75 dark:text-stone-600/75"
      )}
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
    <span
      className={clsx(
        isMobile ? "h-max w-full text-center whitespace-nowrap" : "flex-1"
      )}
    >
      {props.children}
    </span>
  );
}
function StatusValue(props: {
  color?: null | "inverted" | "gray";
  children: number | string;
  disabled?: boolean;
}) {
  const { screenWidth, screenHeight } = useDisplayMode();
  const isMobile = screenWidth < screenHeight;
  if (isMobile) {
    return (
      <span
        className={clsx(
          "mt-1 w-full text-center",
          props.disabled
            ? "text-slate-400/75 dark:text-stone-600/75"
            : props.color === "inverted"
              ? "text-orange-400/75 dark:text-sky-500/75"
              : props.color === "gray"
                ? "text-slate-500/75 dark:text-stone-400/75"
                : null
        )}
        style={{
          fontSize: "2em",
          lineHeight: 1,
        }}
      >
        {props.children}
      </span>
    );
  } else {
    return (
      <span
        className={clsx(
          "inline-flex mt-1 w-4 justify-center items-baseline",
          props.disabled
            ? "text-slate-400/75 dark:text-stone-600/75"
            : props.color === "inverted"
              ? "text-orange-400/75 dark:text-sky-500/75"
              : props.color === "gray"
                ? "text-slate-500/75 dark:text-stone-400/75"
                : null
        )}
        style={{
          fontSize: "2em",
          lineHeight: 1,
        }}
      >
        <span className="relative w-max ">
          {typeof props.children === "number"
            ? props.children % 10
            : props.children.slice(-1)}
          <span className="absolute inset-y-0 right-full ">
            {typeof props.children === "number"
              ? props.children >= 10 && Math.floor(props.children / 10)
              : props.children.slice(0, -1)}
          </span>
        </span>
      </span>
    );
  }
}
