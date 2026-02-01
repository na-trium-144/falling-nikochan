import { RGBColor } from "colorthief";

export const fontMainUi = "merriweather, kaisei-opti";
export const fontTitle = "noto-sans, noto-sans-jp";
export const flexCol = { display: "flex", flexDirection: "column" } as const;
export const flexRow = {
  display: "flex",
  flexDirection: "row",
  alignItems: "baseline",
} as const;
export const slate800 = "rgb(29 41 61)";
export const slate500 = "rgb(98, 116, 142)";
export const slate400 = "rgb(144, 161, 185)";
export const emerald500 = "rgb(0, 188, 125)";
export const amber500 = "rgb(253, 154, 0)";
export const rose400 = "rgb(255, 99, 126)";
export const rose600 = "rgb(236, 0, 63)";
export const emerald600 = "rgb(0, 153, 102)";
export const bold = { fontWeight: 700 } as const;
export const text2xl = { fontSize: 24, lineHeight: 2 / 1.5 } as const;
export const text3xl = { fontSize: 30, lineHeight: 2.25 / 1.875 } as const;
export const text4xl = { fontSize: 36, lineHeight: 2.5 / 2.25 } as const;
export const text5xl = { fontSize: 48, lineHeight: 1 } as const;
export const text7xl = { fontSize: 72, lineHeight: 1 } as const;
export const levelColors = [
  "rgb(0, 122, 85)", // emerald-700
  "rgb(187, 77, 0)", // amber-700
  "rgb(199, 0, 54)", // rose-700
] as const;

export function adjustColor(colorAdjusted: RGBColor) {
  // frontendの common/colorThief.ts に同じ処理がある
  let [r, g, b] = colorAdjusted;
  // 1. 輝度（Brightness）を計算 (0〜255)
  // 人間の目の感度に基づいた重み付け: R(0.299), G(0.587), B(0.114)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
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

  // さらに50%白と混ぜる
  colorAdjusted = [
    Math.round(colorAdjusted[0] + (255 - colorAdjusted[0]) * 0.5),
    Math.round(colorAdjusted[1] + (255 - colorAdjusted[1]) * 0.5),
    Math.round(colorAdjusted[2] + (255 - colorAdjusted[2]) * 0.5),
  ];
  return colorAdjusted;
}
