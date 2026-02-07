"use client";

import clsx from "clsx/lite";
import { CenterBox } from "@/common/box.js";
import Button, { ButtonHighlight } from "@/common/button.js";
import CheckBox from "@/common/checkBox.js";
import Input from "@/common/input";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";
import Caution from "@icon-park/react/lib/icons/Caution";
import Pause from "@icon-park/react/lib/icons/Pause";
import RightOne from "@icon-park/react/lib/icons/RightOne";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  badFastSec,
  badLateSec,
  goodSec,
  okSec,
} from "@falling-nikochan/chart";
import { detectOS } from "@/common/pwaInstall";
import { useDisplayMode } from "@/scale";
import { useDelayedDisplayState } from "@/common/delayedDisplayState";
import Range from "@/common/range";
import DropDown from "@/common/dropdown";
import DownOne from "@icon-park/react/lib/icons/DownOne";
import { Scrollable } from "@/common/scrollable";
import { HelpIcon } from "@/common/caption";
import { APIError } from "@/common/apiError";
import { LinksOnError } from "@/common/errorPageComponent";

interface MessageProps {
  className?: string;
  isTouch: boolean;
  maxHeight: number;
  back?: () => void;
  start: () => void;
  exit: () => void;
  auto: boolean;
  setAuto: (a: boolean) => void;
  userOffset: number;
  setUserOffset: (o: number) => void;
  autoOffset: boolean;
  setAutoOffset: (a: boolean) => void;
  enableSE: boolean;
  setEnableSE: (s: boolean) => void;
  enableIOSThru: boolean;
  setEnableIOSThru: (s: boolean) => void;
  audioLatency: number | null | undefined;
  userBegin: number | null;
  setUserBegin: (b: number | null) => void;
  ytBegin: number;
  ytEnd: number;
  playbackRate: number;
  setPlaybackRate: (r: number) => void;
  editing: boolean;
  lateTimes: number[];
  // hasExplicitSpeedChange: boolean;
  // displaySpeed: boolean;
  // setDisplaySpeed: (s: boolean) => void;
}
export function ReadyMessage(props: MessageProps) {
  const t = useTranslations("play.message");
  const { rem } = useDisplayMode();
  // 開発者ツールで実測し、p-6分を除外 (言語やOSで表示内容若干変わるので、常にこの高さになるわけではない)
  const optionHeight = 18.75 * rem - 3 * rem;
  const fullHeight = 26.8 * rem - 3 * rem;
  const optionMinHeight = optionHeight * 0.6;
  const small = props.maxHeight < fullHeight - optionHeight + optionMinHeight;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, slideIn, setSlideIn] = useDelayedDisplayState(200, {
    delayed: !!props.back,
  });
  const [optionOpen, optionSlideIn, setOptionOpen] =
    useDelayedDisplayState(200);

  return (
    <CenterBox
      classNameOuter={props.className}
      classNameInner="overflow-clip"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      {small && (
        <div
          className={clsx(
            optionOpen ? "flex flex-col" : "hidden",
            "relative transition-all duration-200 ease-out",
            optionSlideIn !== true
              ? "translate-x-full opacity-0"
              : "translate-x-0 opacity-100"
          )}
          style={{ maxHeight: Math.max(optionMinHeight, props.maxHeight) }}
        >
          <p className="fn-heading-box">
            <button
              className={clsx("fn-icon-button", "mr-4 align-bottom")}
              onClick={() => setOptionOpen(false)}
            >
              <ButtonHighlight />
              <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
            </button>
            {t("option")}
          </p>
          <OptionMenu {...props} />
        </div>
      )}
      <div
        className={clsx(
          optionOpen && small ? "hidden" : "flex flex-col",
          "relative transition-all duration-200 ease-out",
          props.back &&
            (slideIn !== true
              ? "translate-x-full opacity-0"
              : "translate-x-0 opacity-100")
        )}
        style={{ maxHeight: small ? undefined : props.maxHeight }}
      >
        <p className="fn-heading-box">
          {props.back && (
            <button
              className={clsx("fn-icon-button", "mr-4 align-bottom")}
              onClick={() => setSlideIn(false, props.back!)}
            >
              <ButtonHighlight />
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
        <p className="mt-2 max-w-96 text-center">
          {t.rich("howToPause", {
            pause: () => (
              <Pause className="inline-block align-middle text-lg " />
            ),
          })}
        </p>
        {props.editing && (
          <p className="mt-2 max-w-96 text-center">
            {t("editingNotification")}
          </p>
        )}
        {small ? (
          <button
            className={clsx("block w-max relative mx-auto mt-2", "fn-link-1")}
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
  const [isIOS, setIsIOS] = useState<boolean>(false);
  useEffect(() => setIsIOS(detectOS() === "ios"), []);
  return (
    <div className="relative pr-8 shrink min-h-0 max-w-full flex flex-col items-center ">
      {props.header && <p className="mb-2">{t("option")}</p>}
      <Scrollable className="flex-1 w-full overflow-x-visible" scrollableY>
        <ul
          className={clsx(
            "m-auto w-fit h-full flex flex-col justify-center text-left list-disc",
            "pl-6 pr-2 space-y-1 overflow-visible"
          )}
        >
          <li className="">
            <CheckBox
              id="auto-play"
              className=""
              value={props.auto}
              onChange={(v) => props.setAuto(v)}
            >
              {t("auto")}
            </CheckBox>
          </li>
          {isIOS && (
            <li>
              <div className="flex items-center">
                <CheckBox
                  id="enable-ios-thru"
                  value={props.enableIOSThru}
                  onChange={(v) => props.setEnableIOSThru(v)}
                >
                  {t("enableIOSThru")}
                </CheckBox>
                <HelpIcon className="-m-2">
                  {t.rich("iOSThruHelp", { br: () => <br /> })}
                </HelpIcon>
              </div>
            </li>
          )}
          <li className="">
            <CheckBox
              id="enable-se"
              className=""
              value={!(isIOS && props.enableIOSThru) && props.enableSE}
              onChange={(v) => props.setEnableSE(v)}
              disabled={isIOS && props.enableIOSThru}
            >
              {t("enableSE")}
            </CheckBox>
            {props.enableSE &&
              !(isIOS && props.enableIOSThru) &&
              props.audioLatency !== undefined && (
                <p className="text-sm max-w-80 text-justify ">
                  <Caution className="inline-block align-middle mr-1" />
                  {props.audioLatency === null
                    ? t("unknownSELatency")
                    : t("enableSELatency", {
                        latency: props.audioLatency.toFixed(3),
                      })}
                </p>
              )}
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
          <li>
            <span className="mr-1">{t("playbackRate")}:</span>
            <DropDown
              options={["0.5", "0.75", "1", "1.25", "1.5", "1.75", "2"].map(
                (s) => ({
                  label: (
                    <>
                      ×
                      <span className="inline-block text-left ml-1 w-9">
                        {s}
                      </span>
                    </>
                  ),
                  value: s,
                })
              )}
              value={props.playbackRate.toString()}
              onSelect={(s: string) => props.setPlaybackRate(Number(s))}
              className={clsx(
                "relative inline-block pr-6 text-center",
                "fn-link-1",
                "fn-input"
              )}
            >
              <div>
                ×
                <span className="inline-block text-left ml-1 w-9">
                  {props.playbackRate}
                </span>
              </div>
              <DownOne
                className="absolute right-1 inset-y-0 h-max m-auto"
                theme="filled"
              />
            </DropDown>
          </li>
          <li>
            <CheckBox
              id="user-begin"
              className=""
              value={props.userBegin !== null}
              onChange={(v) => props.setUserBegin(v ? props.ytBegin : null)}
            >
              {t("userBegin")}
            </CheckBox>
            {props.userBegin !== null && (
              <>
                <span className="inline-block text-right w-6">
                  {Math.floor(Math.round(props.userBegin) / 60)}
                </span>
                <span className="mx-0.5">:</span>
                <span className="inline-block text-left">
                  {(Math.round(props.userBegin) % 60)
                    .toString()
                    .padStart(2, "0")}
                </span>
                {/*<span className="mr-1">{t("offsetSecond")}</span>*/}
                {/*<span className="mr-1">〜</span>
                <span className="mr-1 inline-block text-right w-7">
                  {Math.round(props.ytEnd)}
                </span>
                <span className="">{t("offsetSecond")}</span>*/}
              </>
            )}
            <Range
              className="block! w-full!"
              min={props.ytBegin}
              max={props.ytEnd}
              disabled={props.userBegin === null}
              value={props.userBegin ?? props.ytBegin}
              onChange={props.setUserBegin}
            />
          </li>
          <li className="">
            <div className="inline-block">
              {t("offset")}
              <CheckBox
                id="auto-offset"
                className="ml-2"
                value={props.autoOffset && !props.auto}
                onChange={(v) => props.setAutoOffset(v)}
                disabled={props.auto}
              >
                {t("autoOffset")}
              </CheckBox>
            </div>
            <div className="ml-4">
              <Input
                className="w-16"
                actualValue={
                  (props.userOffset >= 0 ? "+" : "-") +
                  Math.abs(props.userOffset).toFixed(3)
                }
                updateValue={(v) => props.setUserOffset(Number(v))}
                isValid={(v) => !isNaN(Number(v))}
              />
              <span className="mr-1 ">{t("offsetSecond")}</span>
              <Button
                small
                text="-"
                onClick={() => props.setUserOffset(props.userOffset - 0.01)}
              />
              <Button
                small
                text="+"
                onClick={() => props.setUserOffset(props.userOffset + 0.01)}
              />
            </div>
          </li>
        </ul>
      </Scrollable>
      <TimeAdjustBar userOffset={props.userOffset} times={props.lateTimes} />
    </div>
  );
}
function TimeAdjustBar(props: { userOffset: number; times: number[] }) {
  const t = useTranslations("play.message");
  const diffMaxSec = -badFastSec;
  return (
    <div className="absolute inset-y-0 right-1.5 w-4 overflow-visible ">
      <div className="absolute inset-y-0 inset-x-0.5 rounded-xs bg-slate-200 dark:bg-stone-600 " />
      <div className="absolute top-1/2 inset-x-0 h-0 border-b border-slate-300 dark:border-stone-600" />
      <div
        className="absolute inset-x-0 h-full "
        style={{ top: `${(props.userOffset / diffMaxSec) * 50 + 50}%` }}
      >
        {props.times.length > 0 && (
          <>
            <div
              className={clsx(
                "absolute inset-x-0.5 rounded-xs border",
                "border-red-200 bg-red-300/20 dark:border-red-800 dark:bg-red-600/20"
              )}
              style={{
                top: `${(badFastSec / diffMaxSec) * 50}%`,
                height: `${((-badFastSec + badLateSec) / diffMaxSec) * 50}%`,
              }}
            />
            <div
              className={clsx(
                "absolute inset-x-0.5 rounded-xs border",
                "border-sky-200 bg-sky-300/30 dark:border-sky-800 dark:bg-sky-600/30"
              )}
              style={{
                top: `${-(okSec / diffMaxSec) * 50}%`,
                height: `${2 * (okSec / diffMaxSec) * 50}%`,
              }}
            />
            <div
              className={clsx(
                "absolute inset-x-0.5 rounded-xs border",
                "border-lime-200 bg-lime-300/40 dark:border-lime-800 dark:bg-lime-600/40"
              )}
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
  className?: string;
  hidden: boolean;
  isTouch: boolean;
  reset: () => void;
  exit: () => void;
}
export function StopMessage(props: MessageProps2) {
  const t = useTranslations("play.message");

  return (
    <CenterBox
      classNameOuter={props.className}
      hidden={props.hidden}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <p className="fn-heading-box">&lt; {t("stopped")} &gt;</p>
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
  className?: string;
  isTouch: boolean;
  exit: () => void;
  msg: string | APIError;
}
export function InitErrorMessage(props: MessageProps3) {
  const t = useTranslations("play.message");
  const te = useTranslations("error");

  const status = props.msg instanceof APIError ? props.msg.status : undefined;
  const message =
    props.msg instanceof APIError ? props.msg.formatMsg(te) : props.msg;

  return (
    <CenterBox
      classNameOuter={props.className}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      {status && <h4 className="fn-heading-box">Error {status}</h4>}
      <p className="mb-3">{message}</p>
      {props.msg instanceof APIError && props.msg.isServerSide() && (
        <LinksOnError />
      )}
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
