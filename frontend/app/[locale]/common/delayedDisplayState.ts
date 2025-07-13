"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// trueに変わる際にはouterから1フレーム遅れてinnerに反映され、
// falseに変わる際にはinnerからdelayミリ秒遅れてouterに反映される。
export function useDelayedDisplayState(
  delay: number,
  initValue?: boolean
): [boolean, boolean, (value: boolean, runAfter?: () => void) => void] {
  const [valueOuter, setValueOuter] = useState<boolean>(false);
  const [valueInnerNext, setValueInnerNext] = useState<boolean>(false);
  const [valueInner, setValueInner] = useState<boolean>(false);
  useEffect(() => {
    const i = requestAnimationFrame(() => setValueInner(valueInnerNext));
    return () => {
      cancelAnimationFrame(i);
    };
  }, [valueInnerNext]);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setValue = useCallback(
    (value: boolean, runAfter?: () => void) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
      if (value) {
        setValueOuter(value);
        setValueInnerNext(value);
        runAfter?.();
      } else {
        setValueInnerNext(value);
        setValueInner(value);
        timeout.current = setTimeout(() => {
          requestAnimationFrame(() => {
            setValueOuter(value);
            runAfter?.();
          });
        }, delay);
      }
    },
    [delay]
  );
  const isFirstRun = useRef<boolean>(true);
  useEffect(() => {
    if (!isFirstRun.current) return;
    if (initValue === true) {
      setValue(initValue);
    }
    isFirstRun.current = false;
  }, [initValue, setValue]);
  return [valueOuter, valueInner, setValue];
}
