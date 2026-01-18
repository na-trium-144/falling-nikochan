import clsx from "clsx/lite";
import Help from "@icon-park/react/lib/icons/Help";
import { ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  skyFlatButtonBorderStyle1,
  skyFlatButtonBorderStyle2,
} from "./flatButton";

interface CaptionProps {
  top: number;
  left: number;
  content: ReactNode;
}
function Caption({ top, left, content }: CaptionProps) {
  return (
    <div
      className={clsx("pointer-events-none text-sm fixed")}
      style={{ top, left }}
    >
      <span
        className={clsx(
          "absolute inline-block bottom-0 left-0 -translate-x-2/4 translate-y-4.5",
          "border-[0.9rem] border-transparent border-t-sky-300/50 dark:border-t-orange-800/30"
        )}
      />
      <div
        className={clsx(
          "absolute inline-block bottom-0 left-0 -translate-x-2/4 -translate-y-2",
          "text-center rounded-xl min-w-max py-2 px-3 z-1",
          "fn-sky fn-caption",
        )}
      >
        <span className={clsx(skyFlatButtonBorderStyle1, "opacity-100!")} />
        <span className={clsx(skyFlatButtonBorderStyle2, "opacity-100!")} />
        {content}
      </div>
    </div>
  );
}

interface Props {
  className?: string;
  children: ReactNode;
}
export function HelpIcon(props: Props) {
  const [captionData, setCaptionData] = useState<CaptionProps | null>(null);
  const ref = useRef<HTMLDivElement>(null!);

  return (
    <>
      <span
        className={clsx(
          "inline-block align-middle",
          "rounded-full p-2 cursor-help text-xl",
          "hover:bg-sky-100/50 text-sky-300 hover:text-sky-700",
          "dark:hover:bg-stone-800/50 dark:text-orange-900 dark:hover:text-orange-500",
          props.className
        )}
        ref={ref}
        onPointerEnter={() => {
          const rect = ref.current.getBoundingClientRect();
          setCaptionData({
            top: rect.top,
            left: rect.left + rect.width / 2,
            content: props.children,
          });
        }}
        onPointerLeave={() => setCaptionData(null)}
      >
        <Help />
      </span>
      {captionData && createPortal(<Caption {...captionData} />, document.body)}
    </>
  );
}
