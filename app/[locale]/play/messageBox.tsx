"use client";

import { CenterBox } from "@/common/box.js";
import Button from "@/common/button.js";
import CheckBox from "@/common/checkBox.js";
import Input from "@/common/input";
import { useTranslations } from "next-intl";

interface MessageProps {
  isTouch: boolean;
  start: () => void;
  exit: () => void;
  auto: boolean;
  setAuto: (a: boolean) => void;
  userOffset: number;
  setUserOffset: (o: number) => void;
  editing: boolean;
}
export function ReadyMessage(props: MessageProps) {
  const t = useTranslations("play.readyMessage");

  return (
    <CenterBox>
      <p className="text-lg font-title font-bold mb-1">{t("ready")}</p>
      <p>
        <Button
          text={t("start")}
          keyName={props.isTouch ? undefined : "Space"}
          onClick={() => props.start()}
        />
        <Button
          text={t("exit")}
          keyName={props.isTouch ? undefined : "Esc"}
          onClick={() => props.exit()}
        />
      </p>
      <p className="mt-2 text-sm">
        {t.rich("startByTap", {
          isTouch: props.isTouch ? "true" : "false",
          br: () => <br />,
        })}
      </p>
      {props.editing && (
        <p className="mt-2">
          {t.rich("editingNotification", {
            br: () => <br />,
          })}
        </p>
      )}
      <div className="mt-2 mb-2 border-b border-slate-800 dark:border-stone-300" />
      <p>{t("option")}</p>
      <p className="mt-2">
        <CheckBox
          className="ml-1 mr-1"
          value={props.auto}
          onChange={(v) => props.setAuto(v)}
        >
          {t("auto")}
        </CheckBox>
      </p>
      <p className="">
        <span className="">{t("offset")}</span>
        <Input
          className="w-16"
          actualValue={
            (props.userOffset >= 0 ? "+" : "-") +
            Math.abs(props.userOffset).toFixed(2)
          }
          updateValue={(v) => props.setUserOffset(Number(v))}
          isValid={(v) => !isNaN(Number(v))}
        />
        <span className="mr-1 ">{t("offsetSecond")}</span>
        <Button
          text="-"
          onClick={() => props.setUserOffset(props.userOffset - 0.01)}
        />
        <Button
          text="+"
          onClick={() => props.setUserOffset(props.userOffset + 0.01)}
        />
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
  const t = useTranslations("play.stopMessage");

  return (
    <CenterBox>
      <p className="text-lg font-title font-bold mb-1">
        &lt; {t("stopped")} &gt;
      </p>
      <p>
        <Button
          text={t("reset")}
          keyName={props.isTouch ? undefined : "Space"}
          onClick={() => props.reset()}
        />
        <Button
          text={t("exit")}
          keyName={props.isTouch ? undefined : "Esc"}
          onClick={() => props.exit()}
        />
      </p>
    </CenterBox>
  );
}
