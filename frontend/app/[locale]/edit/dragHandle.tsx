"use client";
import { ReactNode, useState } from "react";
import clsx from "clsx/lite";

interface Props {
  className?: string;
  style?: object;
  onMove: (x: number, y: number, cx: number, cy: number) => void;
  onMoveEnd: () => void;
  children?: ReactNode | ReactNode[];
}
export default function DragHandle(props: Props) {
  const [dragging, setDragging] = useState<boolean>(false);
  // なぜかドラッグ中のカーソルがcursor-grabbingにならない なぜ?
  return (
    <div
      className={clsx(
        props.className,
        "z-10",
        dragging ? "cursor-grabbing" : "cursor-grab"
      )}
      style={props.style}
      onPointerMove={(e) => {
        if (dragging) {
          props.onMove(e.movementX, e.movementY, e.clientX, e.clientY);
        }
      }}
      onPointerDown={() => setDragging(true)}
      onPointerUp={() => {
        if (dragging) {
          props.onMoveEnd();
        }
        setDragging(false);
      }}
      onPointerLeave={() => {
        if (dragging) {
          props.onMoveEnd();
        }
        setDragging(false);
      }}
    />
  );
}
