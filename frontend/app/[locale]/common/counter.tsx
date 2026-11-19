"use client";

import clsx from "clsx/lite";
import { useRouter } from "next/navigation";
import { ElementType, ReactNode, useRef, useState } from "react";

interface Props<T extends ElementType> {
  as?: T;
  children: ReactNode;
  className?: string;
  pushHref?: string;
}
export function OpenDevCounter<T extends ElementType = "div">(props: Props<T>) {
  const clickCount = useRef<number>(0);
  const prevClickCount = useRef<DOMHighResTimeStamp>(0);
  const router = useRouter();
  const [showDev, setShowDev] = useState(false);
  const clickCounter = () => {
    if (performance.now() - prevClickCount.current > 1000) {
      clickCount.current = 0;
    }
    prevClickCount.current = performance.now();
    if (++clickCount.current >= 7) {
      if(props.pushHref)
          {router.push(props.pushHref);
      }else{
        setShowDev(true);
      }
    }
    console.log(clickCount.current);
  };

  const Component = props.as || "div";
  return (
    <Component
      className={clsx(
        props.className,
        "fn-counter",
        showDev && "fn-counter-done"
      )}
      onClick={clickCounter}
    >
      {props.children}
    </Component>
  );
}
