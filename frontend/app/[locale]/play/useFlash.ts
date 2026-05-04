import { useCallback, useRef, useState } from "react";
import { FlashPos } from "./fallingWindow";

export function useFlash() {
  // キーを押したとき一定時間光らせる
  // ここではnoteのx座標の値そのままを扱う
  const [barFlash, setBarFlash] = useState<FlashPos>(undefined);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashAnimationFrame = useRef<ReturnType<
    typeof requestAnimationFrame
  > | null>(null);
  const flash = useCallback(function flash_(x: FlashPos) {
    if (flashAnimationFrame.current !== null) {
      cancelAnimationFrame(flashAnimationFrame.current);
      flashAnimationFrame.current = null;
    }
    if (flashTimeout.current !== null) {
      clearTimeout(flashTimeout.current);
      flashTimeout.current = null;
      setBarFlash(undefined);
      flashAnimationFrame.current = requestAnimationFrame(() => {
        flashAnimationFrame.current = null;
        flash_(x);
      });
    } else {
      setBarFlash(x);
      flashTimeout.current = setTimeout(() => {
        flashTimeout.current = null;
        setBarFlash(undefined);
      }, 100);
    }
  }, []);

  return { barFlash, flash };
}
