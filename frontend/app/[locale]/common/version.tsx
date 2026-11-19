"use client";
import clsx from "clsx/lite";
import { CSSProperties, useEffect, useState } from "react";
import * as v from "valibot";

const versionKey = "lastVisited";
const latestChangelogMajor = 18;
const latestChangelogMinor = 13;
function lastVisitedOld(): boolean {
  try {
    if (localStorage.getItem(versionKey)) {
      const [major, minor] = v.parse(
        v.tuple([v.number(), v.number()]),
        JSON.parse(localStorage.getItem(versionKey)!)
      );
      return (
        major < latestChangelogMajor ||
        (major === latestChangelogMajor && minor < latestChangelogMinor)
      );
    }
  } catch (e) {
    console.error(
      `Error parsing ${versionKey}:`,
      v.isValiError(e) ? v.flatten(e.issues) : e
    );
  }
  return true;
}
export function UpdateLastVisited() {
  useEffect(() => {
    localStorage.setItem(
      versionKey,
      JSON.stringify([latestChangelogMajor, latestChangelogMinor])
    );
  }, []);
  return null;
}

export function LastVisitedIndicator(props: { style: CSSProperties }) {
  const [isLastVisitedOld, setIsLastVisitedOld] = useState<boolean>(false);
  useEffect(() => setIsLastVisitedOld(lastVisitedOld()), []);

  return (
    <span
      className={clsx(
        "absolute w-3 h-3 rounded-full bg-red-500",
        isLastVisitedOld ? "inline-block" : "hidden"
      )}
      style={props.style}
    />
  );
}
