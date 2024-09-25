"use client";

import { CenterBox } from "@/common/box";
import Button from "@/common/button";
import { Key } from "@/common/key";
import { useDisplayMode } from "@/scale";

interface MessageProps {
  isTouch: boolean;
  start: () => void;
  exit: () => void;
}
export function ReadyMessage(props: MessageProps) {
  return (
    <CenterBox>
      <p className="mb-1">Ready to start!</p>
      <p>
        <Button
          text="スタート"
          keyName={props.isTouch ? undefined : "Space"}
          onClick={() => props.start()}
        />
        <Button
          text="やめる"
          keyName={props.isTouch ? undefined : "Esc"}
          onClick={() => props.exit()}
        />
      </p>
      <p className="mt-2">
        ※スタートされない場合は
        <br />
        ページを再読み込みしてください
      </p>
    </CenterBox>
  );
}
export function StopMessage(props: MessageProps) {
  return (
    <CenterBox>
      <p className="mb-1">&lt;Stopped&gt;</p>
      <p>
        <Button
          text="再スタート"
          keyName={props.isTouch ? undefined : "Space"}
          onClick={() => props.start()}
        />
        <Button
          text="やめる"
          keyName={props.isTouch ? undefined : "Esc"}
          onClick={() => props.exit()}
        />
      </p>
    </CenterBox>
  );
}
