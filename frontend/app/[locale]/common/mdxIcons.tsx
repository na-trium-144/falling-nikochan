// use clientが指定できないmdxでimportしたいclientコンポーネントのラッパー

"use client";

import Caution from "@icon-park/react/lib/icons/Caution";
import Help from "@icon-park/react/lib/icons/Help";
import Move from "@icon-park/react/lib/icons/Move";
import Sun from "@icon-park/react/lib/icons/Sun";
import Translate from "@icon-park/react/lib/icons/Translate";
import { YouTubeLogo } from "./youtubeLogo";
import PlayOne from "@icon-park/react/lib/icons/PlayOne.js";
import ArrowRight from "@icon-park/react/lib/icons/ArrowRight";

export function TranslateIcon() {
  return <Translate className="inline-block align-middle" />;
}
export function SunIcon() {
  return <Sun className="inline-block align-middle" />;
}
export function HelpIcon() {
  return (
    <Help className="inline-block align-middle text-xl text-sky-300 dark:text-orange-900" />
  );
}
export function MoveIcon() {
  return <Move className="inline-block align-middle " />;
}
export function CautionIcon() {
  return <Caution className="inline-block align-middle " />;
}
export function YoutubeIcon() {
  return <YouTubeLogo />;
}
export function PlayOneIcon() {
  return <PlayOne theme="filled" className="inline-block align-middle" />;
}
export function ArrowRightIcon() {
  return <ArrowRight theme="filled" className="inline-block align-middle" />;
}
