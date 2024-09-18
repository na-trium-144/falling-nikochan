interface KeyProps {
  children: string;
  className?: string;
}
export function Key(props: KeyProps) {
  return (
    <span
      className={
        "border-2 border-black rounded shadow shadow-gray-400 " +
        props.className
      }
      style={{
        background: "rgba(255, 255, 255, 0.7)",
      }}
    >
      {props.children}
    </span>
  );
}
