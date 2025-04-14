// use clientが指定できないmdxでimportしたいclientコンポーネントのラッパー

"use client";

import Caution from "@icon-park/react/lib/icons/Caution";
import Help from "@icon-park/react/lib/icons/Help";
import Move from "@icon-park/react/lib/icons/Move";
import Sun from "@icon-park/react/lib/icons/Sun";
import Translate from "@icon-park/react/lib/icons/Translate";
import Youtube from "@icon-park/react/lib/icons/Youtube";

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
export function YoutubeIcon() {
  return <Youtube className="inline-block align-middle " theme="filled" />;
}
