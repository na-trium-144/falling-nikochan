import { ReactNode } from "react";

function CenterBox(props: { children: ReactNode | ReactNode[] }) {
  return (
    <div
      className="absolute inset-0 w-max h-max m-auto p-6 rounded-lg text-2xl text-center"
      style={{ background: "rgba(255, 255, 255, 0.5)" }}
    >
      {props.children}
    </div>
  );
}
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
interface MessageProps {
  isTouch: boolean;
}
export function ReadyMessage(props: MessageProps) {
  if (props.isTouch) {
    return (
      <CenterBox>
        <p>Tap the video to start!</p>
      </CenterBox>
    );
  } else {
    return (
      <CenterBox>
        <p>
          Press
          <Key className="p-1.5 m-2">Space</Key>
          to start!
        </p>
      </CenterBox>
    );
  }
}
export function StopMessage(props: MessageProps) {
  if (props.isTouch) {
    return (
      <CenterBox>
        <p className="mb-1">&lt;Stopped&gt;</p>
        <p>Tap the video to start again.</p>
      </CenterBox>
    );
  } else {
    return (
      <CenterBox>
        <p className="mb-3">&lt;Stopped&gt;</p>
        <p className="">
          Press
          <Key className="p-1.5 m-2">Space</Key>
          to start again.
        </p>
      </CenterBox>
    );
  }
}
