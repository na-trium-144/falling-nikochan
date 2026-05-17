import { useEffect, useRef, useState } from "react";
import { ChartBrief } from "@falling-nikochan/chart";
import { useColorThief } from "./common/colorThief";
import clsx from "clsx/lite";
import { ChartListItem } from "./main/chartList";

export interface DemoChart {
  cid: string;
  lvIndex: number;
  offset: number;
}
export const demoCharts: DemoChart[] = (
  process.env.NODE_ENV === "development"
    ? ([["102399", 0, 4.5]] as const)
    : ([
        ["850858", 1, 11.3], // bad apple!! single-7
        ["596134", 0, 8.1], // lagtrain single-3
        ["170465", 1, 0], // tetoris double-7
        ["592994", 0, 38.3], // phony single-4
        ["488006", 0, 15.4], // megalovania single-5
        ["142383", 0, 10.8], // night of nights single-6
        ["683932", 1, 10.5], // conflict double-9
        ["768743", 0, 46.4], // freedom dive single-8
      ] as const)
).map(([cid, lvIndex, offset]) => ({ cid, lvIndex, offset }));

export function DemoDetail(
  props: {
    onClick: (cid: string, brief?: ChartBrief) => void;
    onClickMobile: (cid: string, brief: ChartBrief | undefined) => void;
  } & Partial<DemoChart>
) {
  const [brief, setBrief] = useState<ChartBrief>();
  useEffect(() => {
    if (!brief && props.cid) {
      fetch(process.env.BACKEND_PREFIX + `/api/brief/${props.cid}`).then(
        (res) => {
          if (res.ok) {
            res.json().then((brief: ChartBrief) => setBrief(brief));
          }
        },
        () => undefined
      );
    }
  }, [brief, props.cid]);

  const colorThief = useColorThief();

  const [show, setShow] = useState<boolean>(false);
  const initTimeStamp = useRef<DOMHighResTimeStamp | null>(null);
  useEffect(() => {
    if (props.cid && props.lvIndex !== undefined) {
      if (initTimeStamp.current === null) {
        initTimeStamp.current = performance.now();
      }
      if (brief) {
        setTimeout(
          () => setShow(true),
          Math.max(0, initTimeStamp.current + 500 - performance.now())
        );
      }
    }
  }, [props.cid, props.lvIndex, brief]);

  return (
    <>
      <ul
        className={clsx(
          "hidden demo-wide:grid",
          "fn-chart-list fn-cl-big-v w-(--item-max-width)",
          "transition-[translate,opacity] duration-1000 ease-out",
          show ? "" : "opacity-0 translate-y-1"
        )}
      >
        <ChartListItem
          className={colorThief.boxStyle}
          style={{ color: colorThief.currentColor }}
          cid={props.cid ?? ""}
          brief={brief}
          href={`/share/${props.cid}`}
          onClick={() => props.onClick(props.cid!, brief)}
          onClickMobile={() => props.onClickMobile(props.cid!, brief)}
          badge
          big="v"
          noDefaultColor
        />
      </ul>
      <ul
        className={clsx(
          "demo-wide:hidden",
          "fn-chart-list fn-cl-big-h w-[min(var(--item-max-width),var(--item-min-width))] max-w-full",
          "transition-[translate,opacity] duration-1000 ease-out",
          show ? "" : "opacity-0 translate-y-1"
        )}
      >
        <ChartListItem
          className={colorThief.boxStyle}
          style={{ color: colorThief.currentColor }}
          cid={props.cid ?? ""}
          brief={brief}
          href={`/share/${props.cid}`}
          onClick={() => props.onClick(props.cid!, brief)}
          onClickMobile={() => props.onClickMobile(props.cid!, brief)}
          badge
          big="h"
          noDefaultColor
        />
      </ul>
      {brief?.ytId && (
        <img
          ref={colorThief.imgRef}
          className="hidden"
          src={`https://i.ytimg.com/vi/${brief?.ytId}/mqdefault.jpg`}
          crossOrigin="anonymous"
        />
      )}
    </>
  );
}
