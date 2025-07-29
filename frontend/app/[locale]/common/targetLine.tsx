import clsx from "clsx/lite";
interface Props {
  className?: string;
  style?: object;
  barFlash?: boolean;
  left: number | string;
  right: number | string;
  bottom: number | string;
}
export default function TargetLine(props: Props) {
  return (
    <div
      className={clsx(
        "absolute h-0.5 transition duration-100",
        props.barFlash
          ? "bg-amber-400 shadow shadow-yellow-400"
          : "bg-gray-400 shadow-none",
        props.className
      )}
      style={{
        left: props.left,
        right: props.right,
        bottom: props.bottom,
        ...props.style,
      }}
    />
  );
}
