"use client";

import clsx from "clsx/lite";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ExternalLink } from "./extLink";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";

export interface FesData {
  num: number | null;
  kind: "kf" | "mf" | null;
}
export function useFestival(): FesData {
  const [num, setNum] = useState<number | null>(null);
  const [kind, setKind] = useState<"kf" | "mf" | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("fes")) {
      const fesParam = params.get("fes")!;
      const num = Number(fesParam.slice(2));
      const kind = fesParam.slice(0, 2);
      if (num >= 75 && num <= 1000 && ["kf", "mf"].includes(kind)) {
        setNum(num);
        setKind(kind as "kf" | "mf");
        sessionStorage.setItem("fesNum", String(num));
        sessionStorage.setItem("fesKind", kind);
        // replaceStateをするとnextjsのナビゲーションがバグる
        // params.delete("fes");
        // window.history.replaceState(
        //   null,
        //   "",
        //   `${window.location.pathname}?${params}`,
        // );
      } else {
        console.warn(`invalid fes parameter: ${fesParam}`);
      }
    } else {
      const num = Number(sessionStorage.getItem("fesNum"));
      const kind = sessionStorage.getItem("fesKind") as "kf" | "mf";
      if (num && kind) {
        setNum(num);
        setKind(kind);
      }
    }
  }, []);
  return { num, kind };
}
interface Props {
  num: number | null;
  kind: "mf" | "kf" | null;
  className?: string;
}
export function FestivalLink(props: Props) {
  const t = useTranslations("main");
  if (props.num && props.kind) {
    return (
      <span className={clsx("text-lg", props.className)}>
        <ExternalLink href={`https://${props.kind}${props.num}.utcode.net`}>
          <ArrowLeft
            className="inline-block align-middle mr-1"
            theme="filled"
          />
          {t.rich("festival", {
            kind: props.kind,
            num: props.num,
            utcode: () => (
              <img
                src="https://utcode.net/utcode-logo/normal.svg"
                className="inline-block h-[1.5em] -translate-y-[0.1em]"
              />
            ),
          })}
        </ExternalLink>
      </span>
    );
  } else {
    return null;
  }
}
