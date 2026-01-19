import clsx from "clsx/lite";
import { boxBorderStyle1, boxBorderStyle2, boxStyle } from "./box";

export const skyFlatButtonStyle = clsx(
  "relative group cursor-pointer",
  "hover:bg-sky-200 hover:dark:bg-orange-950",
  "active:bg-sky-200 active:dark:bg-orange-950",
  "active:inset-shadow-button inset-shadow-sky-300/50 dark:inset-shadow-orange-975/75"
);
export const skyFlatButtonBorderStyle1 = clsx(
  boxBorderStyle1,
  "border-white/80! dark:border-stone-300/50!",
  "mask-linear-to-50%!",
  "opacity-0 group-hover:opacity-100 group-active:opacity-0"
);
export const skyFlatButtonBorderStyle2 = clsx(
  boxBorderStyle2,
  "border-sky-300/80! dark:border-orange-800/50!",
  "mask-linear-to-75%!",
  "opacity-0 group-hover:opacity-100",
  "group-active:mask-none!"
);

export const invertedFlatButtonStyle = clsx(
  "relative group cursor-pointer",
  "hover:bg-orange-200 hover:dark:bg-sky-950",
  "active:bg-orange-200 active:dark:bg-sky-950",
  "active:inset-shadow-button inset-shadow-orange-300/50 dark:inset-shadow-sky-975/75"
);
export const invertedFlatButtonBorderStyle1 = skyFlatButtonBorderStyle1;
export const invertedFlatButtonBorderStyle2 = clsx(
  boxBorderStyle2,
  "border-orange-300/80! dark:border-sky-800/50!",
  "mask-linear-to-75%!",
  "opacity-0 group-hover:opacity-100",
  "group-active:mask-none!"
);

export const boxButtonStyle = clsx(
  "relative group cursor-pointer",
  boxStyle,
  // boxStyleのinset-shadowをベースに不透明度を25%→50%に変更しただけ
  "active:inset-shadow-button active:inset-shadow-slate-300/50 active:dark:inset-shadow-stone-950/50"
);
export const boxButtonBorderStyle1 = clsx(
  boxBorderStyle1,
  "opacity-100 group-active:opacity-0"
);
export const boxButtonBorderStyle2 = clsx(
  boxBorderStyle2,
  "group-active:mask-none"
);
