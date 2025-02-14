import { ReactNode } from "react";
import { LoadingSlime } from "./loadingSlime.js";
import { ThemeHandler } from "./theme.js";

interface Props {
  children: ReactNode | ReactNode[];
  className?: string;
  style?: object;
}
export function Box(props: Props) {
  return (
    <div
      className={"rounded-lg bg-white/75 dark:bg-stone-800/75 " + (props.className || "")}
      style={{
        backdropFilter: "blur(2px)",
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}

export function CenterBox(props: Props) {
  return (
    <Box
      className={
        "absolute inset-0 w-max max-w-full h-max m-auto p-6 text-center z-20 " +
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
    <main className="w-full h-dvh">
      <CenterBox>{props.children}</CenterBox>
      <ThemeHandler />
    </main>
  );
}

export function ErrorPage(props: { status?: number | string; message?: string }) {
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
  return <ErrorPage status={404} message={"Not Found"} />;
}

export function Loading() {
  return (
    <CenterBoxOnlyPage>
      <p>
        <LoadingSlime />
        Loading...
      </p>
    </CenterBoxOnlyPage>
  );
}
