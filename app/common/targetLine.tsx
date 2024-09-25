interface Props {
  barFlash?: boolean;
  left: number | string;
  right: number | string;
  bottom: number | string;
}
export default function TargetLine(props: Props) {
  return (
    <div
      className={
        "absolute h-0.5 transition duration-100 " +
        (props.barFlash
          ? "bg-amber-400 shadow shadow-yellow-400"
          : "bg-gray-400 shadow-none")
      }
      style={{
        left: props.left,
        right: props.right,
        bottom: props.bottom,
      }}
    />
  );
}
