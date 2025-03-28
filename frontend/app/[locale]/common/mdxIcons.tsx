// use clientが指定できないmdxでimportしたいclientコンポーネントのラッパー

"use client";

import { Caution, Help, Move, Sun, Translate } from "@icon-park/react";

export function TranslateIcon() {
  return <Translate className="inline-block align-middle" />;
}
export function SunIcon() {
  return <Sun className="inline-block align-middle" />;
}
export function HelpIcon() {
  return (
    <span className="inline-block align-middle text-xl text-sky-300 dark:text-orange-900">
      <Help />
    </span>
  );
}
export function MoveIcon() {
  return <Move className="inline-block align-middle " />;
}
export function CautionIcon() {
  return <Caution className="inline-block align-middle " />;
}
