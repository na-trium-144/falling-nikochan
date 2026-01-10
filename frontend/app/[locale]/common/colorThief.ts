"use client";

import ColorThief, { RGBColor } from "colorthief";
import { useEffect, useRef, useState } from "react";

export function useColorThief() {
  const colorThiefRef = useRef<ColorThief>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [color, setColor] = useState<RGBColor | null>(null);

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

  let colorLight: RGBColor | null = color;
  let colorDark: RGBColor | null = color;
  if (color) {
    let [r, g, b] = color;
    // 1. 輝度（Brightness）を計算 (0〜255)
    // 人間の目の感度に基づいた重み付け: R(0.299), G(0.587), B(0.114)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    // 2. 閾値を設定 (黒文字が見やすい明るさの境界線)
    // 140あたりにしておくと少し余裕を持って明るくしてくれます
    const threshold = 140;
    // 3. 暗い場合の処理：白を混ぜて明るくする (Lighten)
    if (brightness < threshold) {
      // 補正強度 (0.1 〜 0.9) - 数字が大きいほど白っぽくなります
      const mixFactor = 0.5;
      // 元の色と白(255)を混ぜる計算
      // 式: 元の色 + (255 - 元の色) * 係数
      colorLight = [
        Math.round(r + (255 - r) * mixFactor),
        Math.round(g + (255 - g) * mixFactor),
        Math.round(b + (255 - b) * mixFactor),
      ];
    }
    const thresholdDark = 115;
    if (brightness > thresholdDark) {
      const mixFactor = 0.5;
      colorDark = [
        Math.round(r * (1 - mixFactor)),
        Math.round(g * (1 - mixFactor)),
        Math.round(b * (1 - mixFactor)),
      ];
    }
  }
  return { imgRef, color, colorLight, colorDark };
}
