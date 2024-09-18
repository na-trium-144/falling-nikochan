import { ReactNode } from "react";

interface Props{
  children: ReactNode | ReactNode[];
  className?: string;
  style?: object;
}
export function Box(props: Props){
  return (
    <div
      className={"rounded-lg " + (props.className || "")}
      style={{ background: "rgba(255, 255, 255, 0.5)", ...props.style }}
    >
      {props.children}
    </div>
  );
}

export function CenterBox(props: { children: ReactNode | ReactNode[] }) {
  return (
    <Box
      className="absolute inset-0 w-max h-max m-auto p-6 text-2xl text-center"
    >
      {props.children}
    </Box>
  );
}
