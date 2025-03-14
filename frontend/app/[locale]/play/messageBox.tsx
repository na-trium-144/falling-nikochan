"use client";

import { CenterBox } from "@/common/box.js";
import Button from "@/common/button.js";
import CheckBox from "@/common/checkBox.js";
import Input from "@/common/input";
import { linkStyle1 } from "@/common/linkStyle";
import { pagerButtonClass } from "@/common/pager";
import { ArrowLeft, Caution, RightOne } from "@icon-park/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  badFastSec,
  badLateSec,
  goodSec,
  okSec,
} from "@falling-nikochan/chart";

interface MessageProps {
  isTouch: boolean;
  back?: () => void;
  start: () => void;
  exit: () => void;
  auto: boolean;
  setAuto: (a: boolean) => void;
  userOffset: number;
  setUserOffset: (o: number) => void;
  editing: boolean;
  lateTimes: number[];
  small: boolean;
  // hasExplicitSpeedChange: boolean;
  // displaySpeed: boolean;
  // setDisplaySpeed: (s: boolean) => void;
}
export function ReadyMessage(props: MessageProps) {
  const t = useTranslations("play.message");
  const [slideIn, setSlideIn] = useState<boolean | null>(null);
  const [optionOpen, setOptionOpen] = useState<boolean>(false);
  const [optionSlideIn, setOptionSlideIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (props.back && slideIn === null) {
      requestAnimationFrame(() => setSlideIn(true));
    }
  }, [props.back, slideIn]);
  useEffect(() => {
    if (optionOpen && optionSlideIn === null) {
      requestAnimationFrame(() => setOptionSlideIn(true));
    }
    if (!optionOpen && optionSlideIn !== null) {
      setOptionSlideIn(null);
    }
  }, [optionOpen, optionSlideIn]);

  // props.small は clientPage.tsx のreadySmall (mainWindowの高さで決まる)
  return (
    <CenterBox className="overflow-clip ">
      {props.small && (
        <div
          className={
            (optionOpen ? "" : "hidden ") +
            "relative transition-all duration-200 ease-out " +
            (optionSlideIn !== true
              ? "translate-x-full opacity-0 "
              : "translate-x-0 opacity-100 ")
          }
        >
          <p className="text-lg font-title font-bold mb-1">
            <button
              className={pagerButtonClass + "mr-4 align-bottom "}
              onClick={() => {
                setOptionSlideIn(false);
                setTimeout(() => setOptionOpen(false), 200);
              }}
            >
              <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
            </button>
            {t("option")}
          </p>
          <OptionMenu {...props} />
        </div>
      )}
      <div
        className={
          (optionOpen && props.small ? "hidden " : "") +
          "relative transition-all duration-200 ease-out " +
          (!props.back
            ? ""
            : slideIn !== true
              ? "translate-x-full opacity-0 "
              : "translate-x-0 opacity-100 ")
        }
      >
        <p className="text-lg font-title font-bold mb-2">
          {props.back && (
            <button
              className={pagerButtonClass + "mr-4 align-bottom "}
              onClick={() => {
                setSlideIn(false);
                setTimeout(props.back!, 200);
              }}
            >
              <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
            </button>
          )}
          {t("ready")}
        </p>
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
        {props.small ? (
          <button
            className={"block w-max relative mx-auto mt-2 " + linkStyle1}
            onClick={() => setOptionOpen(!optionOpen)}
          >
            <RightOne className="absolute left-0 bottom-1 " theme="filled" />
            <span className="ml-5">{t("option")}</span>
          </button>
        ) : (
          <>
            <div className="mt-2 mb-2 border-b border-slate-800 dark:border-stone-300" />
            <OptionMenu {...props} header />
          </>
        )}
      </div>
    </CenterBox>
  );
}
function OptionMenu(props: MessageProps & { header?: boolean }) {
  const t = useTranslations("play.message");
  return (
    <div className="relative pr-8 min-h-32 max-w-full flex flex-col items-center ">
      {props.header && <p className="mb-2">{t("option")}</p>}
      <ul className="flex-1 flex flex-col w-fit justify-center text-left list-disc ml-6">
        <li className="">
          <CheckBox
            className=""
            value={props.auto}
            onChange={(v) => props.setAuto(v)}
          >
            {t("auto")}
          </CheckBox>
        </li>
        {/* <li className="">
          <CheckBox
            className=""
            value={props.displaySpeed}
            onChange={(v) => props.setDisplaySpeed(v)}
            disabled={!props.hasExplicitSpeedChange}
          >
            {t("displaySpeed")}
          </CheckBox>
        </li>*/}
        <li className="">
          <div className="">{t("offset")}</div>
          <div className="">
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
          </div>
        </li>
      </ul>
      <TimeAdjustBar userOffset={props.userOffset} times={props.lateTimes} />
    </div>
  );
}
function TimeAdjustBar(props: { userOffset: number; times: number[] }) {
  const t = useTranslations("play.message");
  const diffMaxSec = -badFastSec;
  return (
    <div className="absolute inset-y-0 right-0 w-4 overflow-visible ">
      <div className="absolute inset-y-0 inset-x-0.5 rounded-xs bg-slate-200 dark:bg-stone-700 " />
      <div className="absolute top-1/2 inset-x-0 h-0 border-b border-slate-300 dark:border-stone-600" />
      <div
        className="absolute inset-x-0 h-full "
        style={{ top: `${(props.userOffset / diffMaxSec) * 50 + 50}%` }}
      >
        {props.times.length > 0 && (
          <>
            <div
              className={
                "absolute inset-x-0.5 rounded-xs border " +
                "border-red-200 bg-red-300/20 dark:border-red-800 dark:bg-red-600/20 "
              }
              style={{
                top: `${(badFastSec / diffMaxSec) * 50}%`,
                height: `${((-badFastSec + badLateSec) / diffMaxSec) * 50}%`,
              }}
            />
            <div
              className={
                "absolute inset-x-0.5 rounded-xs border " +
                "border-sky-200 bg-sky-300/30 dark:border-sky-800 dark:bg-sky-600/30 "
              }
              style={{
                top: `${-(okSec / diffMaxSec) * 50}%`,
                height: `${2 * (okSec / diffMaxSec) * 50}%`,
              }}
            />
            <div
              className={
                "absolute inset-x-0.5 rounded-xs border " +
                "border-lime-200 bg-lime-300/40 dark:border-lime-800 dark:bg-lime-600/40 "
              }
              style={{
                top: `${-(goodSec / diffMaxSec) * 50}%`,
                height: `${2 * (goodSec / diffMaxSec) * 50}%`,
              }}
            />
          </>
        )}
        <div className="absolute top-0 inset-x-0 h-0 border-b border-gray-400 " />
      </div>
      <span className="absolute top-0 right-1/2 translate-x-1/2 text-xs">
        {t("offsetFast")}
      </span>
      <span className="absolute bottom-0 right-1/2 translate-x-1/2 text-xs">
        {t("offsetLate")}
      </span>
      {props.times.map((t, i) => (
        <div
          key={i}
          className="absolute inset-x-1.5 h-0 rounded-xs border border-amber-500/40 "
          style={{
            top: `${(t / diffMaxSec) * 50 + 50}%`,
          }}
        />
      ))}
    </div>
  );
}

interface MessageProps2 {
  hidden: boolean;
  isTouch: boolean;
  reset: () => void;
  exit: () => void;
}
export function StopMessage(props: MessageProps2) {
  const t = useTranslations("play.message");

  return (
    <CenterBox className={props.hidden ? "hidden" : ""}>
      <p className="text-lg font-title font-bold mb-2">
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

interface MessageProps3 {
  isTouch: boolean;
  exit: () => void;
  msg: string;
}
export function InitErrorMessage(props: MessageProps3) {
  const t = useTranslations("play.message");

  return (
    <CenterBox>
      <p className="mb-2">
        <Caution className="inline-block text-lg align-middle mr-1" />
        {props.msg}
      </p>
      <p>
        <Button
          text={t("exit")}
          keyName={props.isTouch ? undefined : "Esc"}
          onClick={() => props.exit()}
        />
      </p>
    </CenterBox>
  );
}
