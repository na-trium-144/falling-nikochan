"use client";

import { CenterBox } from "@/common/box";
import Button from "@/common/button";
import CheckBox from "@/common/checkBox";

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
      <p className="text-lg font-title font-bold mb-1">Ready to start!</p>
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
      <p className="mt-2 text-sm">
        または右上の動画を{props.isTouch ? "タップ" : "クリック"}で
        <br />
        スタート・停止
      </p>
      {props.editing && (
        <p className="mt-2">
          編集画面で変更した譜面は、
          <br />
          ページ再読み込みでこちらに反映されます。
        </p>
      )}
      <div className="mt-2 mb-2 border-b border-slate-800 dark:border-stone-300" />
      <p>オプション</p>
      <p className="mt-2">
        <CheckBox
          className="ml-1 mr-1"
          value={props.auto}
          onChange={(v) => props.setAuto(v)}
        >
          <span>オートプレイ</span>
        </CheckBox>
      </p>
    </CenterBox>
  );
}
interface MessageProps2 {
  isTouch: boolean;
  reset: () => void;
  exit: () => void;
}
export function StopMessage(props: MessageProps2) {
  return (
    <CenterBox>
      <p className="text-lg font-title font-bold mb-1">&lt;Stopped&gt;</p>
      <p>
        <Button
          text="もう一度"
          keyName={props.isTouch ? undefined : "Space"}
          onClick={() => props.reset()}
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
