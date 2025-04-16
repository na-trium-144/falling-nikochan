"use client";

import FiveStarBadge from "@icon-park/react/lib/icons/FiveStarBadge";
import { useTheme } from "./theme";
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
}
export function LevelBadge(props: Props) {
  const themeState = useTheme();
  const iconFill = themeState.isDark
    ? ["#016630" /*green-800*/, "#d08700" /*yellow-600*/]
    : ["#009966" /*emerald-600*/, "#ffba00" /*amber-400*/];
  return props.status.toReversed().map((s, i) => (
    <span
      className={
        "w-max h-max text-emerald-600 dark:text-green-800 " + props.className
      }
      style={{ transform: `translateX(${-i * 0.8}rem)` }}
      key={i}
    >
      {s === "pc" ? (
        <FiveStarBadge
          theme="two-tone"
          fill={iconFill}
          className="text-xl inline-block -translate-y-2"
        />
      ) : s === "fc" ? (
        <FiveStarBadge className="text-xl inline-block -translate-y-2" />
      ) : s === "b" ? (
        <CheckSmall className="inline-block -translate-y-1 -translate-x-0.5" />
      ) : null}
    </span>
  ));
}
