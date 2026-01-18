"use client";

import ColorThief, { RGBColor } from "colorthief";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "./theme";
import clsx from "clsx/lite";
import { boxBorderStyle1, boxBorderStyle2 } from "./box";

export function useColorThief() {
  const colorThiefRef = useRef<ColorThief>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [color, setColor] = useState<RGBColor | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (colorThiefRef.current === null) {
      colorThiefRef.current = new ColorThief();
    }
    if (imgRef.current) {
      if (imgRef.current.complete) {
        setColor(colorThiefRef.current.getColor(imgRef.current));
      } else {
        imgRef.current.onload = () => {
          setColor(colorThiefRef.current!.getColor(imgRef.current!));
        };
      }
    }
  }, [imgRef.current?.src]);

  let colorAdjusted: RGBColor | null = color;
  if (colorAdjusted) {
    let [r, g, b] = colorAdjusted;
    // 1. 輝度（Brightness）を計算 (0〜255)
    // 人間の目の感度に基づいた重み付け: R(0.299), G(0.587), B(0.114)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (isDark) {
      // 115
      const thresholdDark = 160;
      if (brightness > thresholdDark) {
        const mixFactor = thresholdDark / brightness;
        colorAdjusted = [
          Math.round(r * mixFactor),
          Math.round(g * mixFactor),
          Math.round(b * mixFactor),
        ];
      }
    } else {
      // 2. 閾値を設定 (黒文字が見やすい明るさの境界線)
      // 140あたりにしておくと少し余裕を持って明るくしてくれます
      const threshold = 100;
      // 3. 暗い場合の処理：白を混ぜて明るくする (Lighten)
      if (brightness < threshold) {
        // 補正強度 (0.1 〜 0.9) - 数字が大きいほど白っぽくなります
        const mixFactor = (threshold - brightness) / (255 - brightness);
        // 元の色と白(255)を混ぜる計算
        // 式: 元の色 + (255 - 元の色) * 係数
        colorAdjusted = [
          Math.round(r + (255 - r) * mixFactor),
          Math.round(g + (255 - g) * mixFactor),
          Math.round(b + (255 - b) * mixFactor),
        ];
      }
    }
  }
  return {
    imgRef,
    ready: color !== null,
    boxStyle: clsx(
      "inset-shadow-button",
      "inset-shadow-slate-300/15 dark:inset-shadow-stone-950/15",
      colorAdjusted
        ? clsx(
            "bg-[color-mix(in_oklab,currentColor_50%,var(--color-white))]",
            "dark:bg-[color-mix(in_oklab,currentColor_50%,var(--color-stone-700))]"
          )
        : "bg-white/50 dark:bg-stone-700/50"
    ),
    currentColor: colorAdjusted
      ? `rgb(${colorAdjusted[0]}, ${colorAdjusted[1]}, ${colorAdjusted[2]})`
      : isDark
        ? "var(--color-stone-700)"
        : "var(--color-white)",
    boxBorderStyle1: boxBorderStyle1,
    boxBorderStyle2: clsx(boxBorderStyle2, "border-current/75!"),
  };
}
