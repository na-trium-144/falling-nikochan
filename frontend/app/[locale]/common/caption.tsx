import clsx from "clsx";
import Help from "@icon-park/react/lib/icons/Help";
import { createContext, ReactNode, useContext, useRef, useState } from "react";

interface CaptionData {
  top: number;
  left: number;
  content: ReactNode;
}
interface ICaptionContext {
  data: CaptionData | null;
  setData: (data: CaptionData | null) => void;
}
const CaptionContext = createContext<ICaptionContext>(null!);

export function CaptionProvider(props: { children: ReactNode }) {
  const [data, setData] = useState<CaptionData | null>(null);
  return (
    <CaptionContext.Provider value={{ data, setData }}>
      {props.children}
      <Caption
        className={clsx("fixed", data || "hidden")}
        style={{ top: data?.top, left: data?.left }}
      >
        {data?.content}
      </Caption>
    </CaptionContext.Provider>
  );
}

interface CProps {
  className?: string;
  style?: object;
  children: ReactNode;
}
export function Caption(props: CProps) {
  return (
    <div
      className={clsx(
        "opacity-90 pointer-events-none text-sm",
        props.className
      )}
      style={{ ...props.style }}
    >
      <span
        className={clsx(
          "absolute inline-block bottom-0 left-0 -translate-x-2/4 translate-y-4.5",
          "border-[1rem] border-transparent border-t-sky-950 dark:border-t-orange-950"
        )}
      />
      <div
        className={clsx(
          "absolute inline-block bottom-0 left-0 -translate-x-2/4 -translate-y-2",
          "text-center rounded-lg min-w-max py-1 px-2 z-1",
          "bg-sky-950 text-slate-300 dark:bg-orange-950"
        )}
      >
        {props.children}
      </div>
    </div>
  );
}

interface Props {
  className?: string;
  children: ReactNode;
}
export function HelpIcon(props: Props) {
  const { setData } = useContext(CaptionContext);
  const ref = useRef<HTMLDivElement>(null!);
  return (
    <span
      className={clsx(
        "inline-block align-middle",
        "rounded-full p-2 cursor-help text-xl",
        "hover:bg-sky-100 text-sky-300 hover:text-sky-700",
        "dark:hover:bg-stone-800 dark:text-orange-900 dark:hover:text-orange-500",
        props.className
      )}
      ref={ref}
      onPointerEnter={() => {
        const rect = ref.current.getBoundingClientRect();
        setData({
          top: rect.top,
          left: rect.left + rect.width / 2,
          content: props.children,
        });
        // setTop(rect.top);
        // setLeft(rect.left + ref.current.clientWidth / 2);
      }}
      onPointerLeave={() => setData(null)}
    >
      <Help />
    </span>
  );
}
