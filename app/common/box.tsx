import { ReactNode } from "react";

interface Props {
  children: ReactNode | ReactNode[];
  className?: string;
  style?: object;
}
export function Box(props: Props) {
  return (
    <div
      className={"rounded-lg " + (props.className || "")}
      style={{ background: "rgba(255, 255, 255, 0.5)", ...props.style }}
    >
      {props.children}
    </div>
  );
}

export function CenterBox(props: Props) {
  return (
    <Box
      className={
        "absolute inset-0 w-max h-max m-auto p-6 text-center " +
        (props.className || "")
      }
      style={props.style}
    >
      {props.children}
    </Box>
  );
}

export function CenterBoxOnlyPage(props: {
  children: ReactNode | ReactNode[];
}) {
  return (
    <main className="w-screen h-screen">
      <CenterBox>{props.children}</CenterBox>
    </main>
  );
}

export function NotFound() {
  return (
    <CenterBoxOnlyPage>
      <p>404 Not Found</p>
    </CenterBoxOnlyPage>
  );
}

export function ChartFetchError() {
  return (
    <CenterBoxOnlyPage>
      <p>Error: Bad chart ID</p>
    </CenterBoxOnlyPage>
  );
}
export function Loading() {
  return (
    <CenterBoxOnlyPage>
      <p>Loading...</p>
    </CenterBoxOnlyPage>
  );
}
