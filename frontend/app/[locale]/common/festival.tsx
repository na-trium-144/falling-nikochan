"use client";

import clsx from "clsx/lite";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ExternalLink } from "./extLink";

export function useFestival() {
  const [num, setNum] = useState<number | null>(null);
  const [kind, setKind] = useState<"kf" | "mf" | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("fes")) {
      const fesParam = params.get("fes")!;
      const num = Number(fesParam.slice(2));
      const kind = fesParam.slice(0, 2) as "kf" | "mf";
      setNum(num);
      setKind(kind);
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
      <span className={clsx(props.className)}>
        <ExternalLink href="https://festival.utcode.net" className="inline!">
          {/* テキストが長く、iOSで収まらない & アイコンがあるわけでもない のでinline */}
          {t("festival", { kind: props.kind, num: props.num })}
        </ExternalLink>
      </span>
    );
  } else {
    return null;
  }
}
