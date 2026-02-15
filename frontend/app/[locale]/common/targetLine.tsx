import clsx from "clsx/lite";
import { useEffect, useRef, useState } from "react";
interface Props {
  className?: string;
  style?: object;
  // shadowが広がるアニメーションの開始位置
  // TargetLineの左端からの画面上のx座標距離(px), またはleft: calc({} - 100%)に入れられる文字列
  barFlash?: number | string;
  left: number | string;
  right: number | string;
  bottom: number | string;
}
export default function TargetLine(props: Props) {
  const { barFlash, className, style, left, right, bottom } = props;
  const [spreadShadow, setSpreadShadow] = useState(false);
  useEffect(() => {
    console.log(barFlash);
    if (barFlash !== undefined) {
      // なぜかrequestAnimationFrameだけではdelayが足りない
      const t = setTimeout(() =>
        requestAnimationFrame(() => {
          setSpreadShadow(true);
        })
      );
      return () => {
        clearTimeout(t);
      };
    } else {
      const t = setTimeout(() => {
        setSpreadShadow(false);
      }, 400);
      return () => {
        setSpreadShadow(false);
        clearTimeout(t);
      };
    }
  }, [barFlash]);
  const flashPos = useRef<number | string>(0);
  if (barFlash !== undefined) {
    flashPos.current = barFlash;
  }
  return (
    <div
      className={clsx(
        "absolute h-0.5 transition-all",
        "overflow-x-clip",
        barFlash !== undefined
          ? "bg-amber-400/70 duration-0"
          : "bg-black/35 dark:bg-white/35 duration-500",
        className
      )}
      style={{
        left: left,
        right: right,
        bottom: bottom,
        ...style,
      }}
    >
      <div
        className={clsx(
          "absolute inset-y-0 rounded-[50%]",
          "shadow-[0_0_1rem_0.05rem] shadow-yellow-400",
          "origin-center transition ease-linear",
          spreadShadow
            ? "scale-x-100 opacity-0 duration-400"
            : "scale-x-0 opacity-100 duration-0"
          // barFlash === undefined && spreadShadow
          //   ? "opacity-0"
          //   : "opacity-100",
          // barFlash === undefined && !spreadShadow && "hidden"
        )}
        style={{
          left:
            typeof flashPos.current === "number"
              ? `calc(${flashPos.current}px - 100%)`
              : `calc(${flashPos.current ?? "0px"} - 100%)`,
          width: "200%",
        }}
      />
    </div>
  );
}
