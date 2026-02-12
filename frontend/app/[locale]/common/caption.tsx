import clsx from "clsx/lite";
import Help from "@icon-park/react/lib/icons/Help";
import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ButtonHighlight } from "./button";

interface CaptionProps {
  top: number;
  left: number;
  content: ReactNode;
}
function Caption({ top, left, content }: CaptionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState("-50%"); // 基本は中央

  useLayoutEffect(() => {
    if (contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      const padding = 0;
      let offset = 0;

      if (rect.left < padding) {
        offset = padding - rect.left;
      } else if (rect.right > window.innerWidth - padding) {
        offset = window.innerWidth - padding - rect.right;
      }

      setTranslateX(`calc(-50% + ${offset}px)`);
    }
  }, [left, content]);

  return (
    <div
      className={clsx("pointer-events-none text-sm fixed z-caption isolate")}
      style={{ top, left }}
    >
      <div
        ref={contentRef}
        className={clsx(
          // 色だけcssで定義、他は直接utilityクラス
          "fn-sky fn-caption",
          "absolute inline-block bottom-0 left-0",
          "text-center rounded-sq-2xl min-w-max py-2 px-3 z-1"
        )}
        style={{ translate: `${translateX} -0.5rem` }}
      >
        <span className="fn-glass-1" />
        <span className="fn-glass-2" />
        {content}
      </div>
      <span
        className={clsx(
          "absolute inline-block bottom-0 left-0 -translate-x-2/4 translate-y-4.5",
          "border-[0.9rem] fn-caption-border"
        )}
      />
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
        className={clsx("fn-help-icon", props.className)}
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
        <ButtonHighlight />
        <Help className="inline-block align-middle text-xl" />
      </span>
      {captionData && createPortal(<Caption {...captionData} />, document.body)}
    </>
  );
}
