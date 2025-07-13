"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// trueに変わる際にはouterから1フレーム遅れてinnerに反映され、
// falseに変わる際にはinnerからdelayミリ秒遅れてouterに反映される。
export function useDelayedDisplayState(
  delay: number,
  initValue?: { initial?: boolean; delayed?: boolean }
): [boolean, boolean, (value: boolean, runAfter?: () => void) => void] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [delayedInitialValue, _setDelayedInitialValue] = useState<
    boolean | undefined
  >(initValue?.delayed);
  const [valueOuter, setValueOuter] = useState<boolean>(!!initValue?.initial);
  const [valueInnerNext, setValueInnerNext] = useState<boolean>(
    !!initValue?.initial
  );
  const [valueInner, setValueInner] = useState<boolean>(!!initValue?.initial);
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
  useEffect(() => {
    if (delayedInitialValue !== undefined) {
      setValue(delayedInitialValue);
    }
  }, [delayedInitialValue, setValue]);
  return [valueOuter, valueInner, setValue];
}
