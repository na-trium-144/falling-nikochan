"use client";

import clsx from "clsx";
import FiveStarBadge from "@icon-park/react/lib/icons/FiveStarBadge";
import CheckSmall from "@icon-park/react/lib/icons/CheckSmall";
import { ResultData } from "./bestScore";
import { baseScoreRate, chainScoreRate } from "@falling-nikochan/chart";

export type BadgeStatus = "pc" | "fc" | "b" | null | undefined;
export function getBadge(s: ResultData | null): BadgeStatus {
  if (s) {
    if (s.baseScore === baseScoreRate) {
      return "pc";
    } else if (s.chainScore === chainScoreRate) {
      return "fc";
    } else if (s.baseScore + s.chainScore + s.bigScore >= 70) {
      return "b";
    }
  }
  return null;
}
interface Props {
  className: string;
  status: BadgeStatus[];
  levels: number[];
  showDot?: boolean;
}
export function LevelBadge(props: Props) {
  const iconFill = "#fcc800"; // yellow-400
  const iconColors = [
    "#009966", // emerald-600
    "#e17100", // amber-600
    "#ec003f", // rose-600
  ];
  const iconColorClasses = [
    "text-emerald-600",
    "text-amber-600",
    "text-rose-600",
  ];
  return props.status.toReversed().map((s, i) => (
    <span
      className={clsx(
        "w-5 h-5 text-center text-base",
        iconColorClasses[props.levels.toReversed()[i]],
        props.className
      )}
      style={{ transform: `translateX(${-i * 0.8}rem)` }}
      key={i}
    >
      {s === "pc" ? (
        <FiveStarBadge
          theme="two-tone"
          fill={[iconColors[props.levels.toReversed()[i]], iconFill]}
          className="text-xl inline-block -translate-y-2"
        />
      ) : s === "fc" ? (
        <FiveStarBadge className="text-xl inline-block -translate-y-2" />
      ) : s === "b" ? (
        <CheckSmall className="inline-block -translate-y-1 " />
      ) : (
        props.showDot && (
          <span className="inline-block -translate-y-1.5 ">・</span>
        )
      )}
    </span>
  ));
}
