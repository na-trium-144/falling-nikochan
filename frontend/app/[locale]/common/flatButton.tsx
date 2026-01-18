import clsx from "clsx/lite";
import { boxBorderStyle1, boxBorderStyle2 } from "./box";

// skyFlatButtonBorderStyle1 is kept for export as it's used in chartList.tsx
export const skyFlatButtonBorderStyle1 = clsx(
  boxBorderStyle1,
  "border-white/80! dark:border-stone-300/50!",
  "mask-linear-to-50%!",
  "opacity-0 group-hover:opacity-100 group-active:opacity-0"
);
// skyFlatButtonBorderStyle2 is kept for export as it's used in chartList.tsx
export const skyFlatButtonBorderStyle2 = clsx(
  boxBorderStyle2,
  "border-sky-300/80! dark:border-orange-800/50!",
  "mask-linear-to-75%!",
  "opacity-0 group-hover:opacity-100",
  "group-active:mask-none!"
);

// invertedFlatButtonBorderStyle1 is kept for export as it's equal to skyFlatButtonBorderStyle1
export const invertedFlatButtonBorderStyle1 = skyFlatButtonBorderStyle1;
// invertedFlatButtonBorderStyle2 is kept for export
export const invertedFlatButtonBorderStyle2 = clsx(
  boxBorderStyle2,
  "border-orange-300/80! dark:border-sky-800/50!",
  "mask-linear-to-75%!",
  "opacity-0 group-hover:opacity-100",
  "group-active:mask-none!"
);
