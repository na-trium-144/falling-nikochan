"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * trueに変わる際にはouterから1フレーム遅れてinnerに反映され、
 * falseに変わる際にはinnerからdelayミリ秒遅れてouterに反映される。
 *
 * initValue.initial がtrueの場合、最初のフレームからinnerもouterもtrue
 * initValue.delayed がtrueの場合、最初のフレームではouterのみtrueで、1フレーム遅れてinnerがtrueになる
 * どちらもtrueでない場合、デフォルトはfalse
 */
export function useDelayedDisplayState(
  delay: number,
  initValue?: { initial?: boolean; delayed?: boolean }
): [boolean, boolean, (value: boolean, runAfter?: () => void) => void] {
  const [valueOuter, setValueOuter] = useState<boolean>(
    !!initValue?.delayed || !!initValue?.initial
  );
  const [valueInnerNext, setValueInnerNext] = useState<boolean>(
    !!initValue?.delayed || !!initValue?.initial
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
  return [valueOuter, valueInner, setValue];
}
