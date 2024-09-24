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

export function Error(props: { status?: number; message?: string }) {
  return (
    <CenterBoxOnlyPage>
      <p>
        {props.status ? `${props.status}: ` : ""}
        {String(props.message)}
      </p>
    </CenterBoxOnlyPage>
  );
}
export function NotFound() {
  return <Error status={404} message={"Not Found"} />;
}

export function Loading() {
  return (
    <CenterBoxOnlyPage>
      <p>
        <span className="loader" />
        Loading...
      </p>
    </CenterBoxOnlyPage>
  );
}
