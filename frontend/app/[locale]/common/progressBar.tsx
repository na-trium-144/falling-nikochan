import clsx from "clsx";
import { levelBgColors } from "./levelColors.js";

interface Props {
  value: number;
  className?: string;
  fixedColor?: string;
}
export default function ProgressBar(props: Props) {
  return (
    <div
      className={clsx(
        "relative h-1 rounded-full shadow bg-black/25 dark:bg-white/25",
        props.className
      )}
    >
      <div
        className={clsx(
          "absolute inset-y-0 rounded-full",
          props.fixedColor !== undefined
            ? props.fixedColor
            : props.value < 0.5
              ? levelBgColors[0]
              : props.value < 0.75
                ? levelBgColors[1]
                : levelBgColors[2]
        )}
        style={{
          width: Math.min(1, props.value) * 100 + "%",
        }}
      />
    </div>
  );
}
