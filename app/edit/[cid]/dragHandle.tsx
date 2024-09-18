"use client";
import { ReactNode, useState } from "react";

interface Props {
  className?: string;
  style?: object;
  onMove: (x: number, y: number, cx: number, cy: number) => void;
  children?: ReactNode | ReactNode[];
}
export default function DragHandle(props: Props) {
  const [dragging, setDragging] = useState<boolean>(false);
  return (
    <button
      className={props.className}
      style={props.style}
      onPointerMove={(e) => {
        if (dragging) {
          props.onMove(e.movementX, e.movementY, e.clientX, e.clientY);
        }
      }}
      onPointerDown={() => setDragging(true)}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
    />
  );
}
