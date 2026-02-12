import clsx from "clsx/lite";

interface Props {
  value: number;
  className?: string;
  fixedColor?: string;
}
export default function ProgressBar(props: Props) {
  return (
    <div className={clsx("fn-progressbar", props.className)}>
      <div
        className={clsx(
          props.fixedColor !== undefined
            ? props.fixedColor
            : props.value < 0.5
              ? "fn-pbar-green"
              : props.value < 0.75
                ? "fn-pbar-yellow"
                : "fn-pbar-red"
        )}
        style={{
          width: Math.min(1, props.value) * 100 + "%",
        }}
      />
    </div>
  );
}
