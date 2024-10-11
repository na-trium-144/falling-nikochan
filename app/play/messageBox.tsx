"use client";

import { CenterBox } from "@/common/box";
import Button from "@/common/button";

interface MessageProps {
  isTouch: boolean;
  start: () => void;
  exit: () => void;
  auto: boolean;
  setAuto: (a: boolean) => void;
  editing: boolean;
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
      {props.editing && (
        <p className="mt-2">
          編集画面で変更した譜面は、
          <br />
          ページ再読み込みでこちらに反映されます。
        </p>
      )}
      <div className="mt-2 mb-2 border-b border-black" />
      <p>オプション</p>
      <p className="mt-2">
        <input
          className="ml-1 mr-1"
          type="checkbox"
          id="auto"
          checked={props.auto}
          onChange={(v) => props.setAuto(v.target.checked)}
        />
        <label htmlFor="auto">
          <span>オートプレイ</span>
        </label>
      </p>
    </CenterBox>
  );
}
interface MessageProps2 {
  isTouch: boolean;
  start: () => void;
  exit: () => void;
}
export function StopMessage(props: MessageProps2) {
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
