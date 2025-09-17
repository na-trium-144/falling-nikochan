"use client";

import clsx from "clsx/lite";
import Input from "@/common/input.js";
import {
  Step,
  stepAdd,
  stepCmp,
  stepImproper,
  stepSimplify,
  stepSub,
  stepToFloat,
  stepZero,
} from "@falling-nikochan/chart";
import CheckBox from "@/common/checkBox.js";
import { getSignatureState } from "@falling-nikochan/chart";
import {
  barFromLength,
  getBarLength,
  Signature,
  SignatureWithLua,
  toStepArray,
} from "@falling-nikochan/chart";
import { useEffect, useRef, useState } from "react";
import Close from "@icon-park/react/lib/icons/Close";
import CornerDownLeft from "@icon-park/react/lib/icons/CornerDownLeft";
import { useTranslations } from "next-intl";
import { HelpIcon } from "@/common/caption";
import { LevelEdit } from "@falling-nikochan/chart";
import VolumeNotice from "@icon-park/react/lib/icons/VolumeNotice";

interface Props {
  offset?: number;
  setOffset: (offset: number) => void;
  prevBpm?: number;
  prevSpeed?: number;
  currentLevel: LevelEdit | undefined;
  currentBpmIndex?: number;
  currentBpm?: number;
  setCurrentBpm: (bpm: number | null, speed: number | null) => void;
  bpmChangeHere: boolean;
  toggleBpmChangeHere: (bpm: boolean | null, speed: boolean | null) => void;
  currentSpeedIndex?: number;
  currentSpeed?: number;
  prevSignature?: Signature;
  speedChangeHere: boolean;
  currentSignature?: SignatureWithLua;
  setCurrentSignature: (sig: Signature) => void;
  signatureChangeHere: boolean;
  toggleSignatureChangeHere: () => void;
  setYTBegin: (ytBegin: number) => void;
  setYTEnd: (ytEnd: number | "note" | "yt") => void;
  currentLevelLength: number;
  ytDuration: number;
  currentStep: Step;
  enableSE: boolean;
  setEnableSE: (enableSE: boolean) => void;
  seVolume: number;
  setSEVolume: (seVolume: number) => void;
}
export default function TimingTab(props: Props) {
  const t = useTranslations("edit.timing");

  const offsetValid = (offset: string) =>
    offset !== "" && !isNaN(Number(offset)) && Number(offset) >= 0;
  const bpmValid = (bpm: string) =>
    bpm !== "" && !isNaN(Number(bpm)) && Number(bpm) > 0;
  const speedValid = (bpm: string) => bpm !== "" && !isNaN(Number(bpm));
  const ytEndValid = (offset: string) =>
    offset !== "" &&
    !isNaN(Number(offset)) &&
    Number(offset) >= props.currentLevelLength &&
    Number(offset) <= props.ytDuration;

  const bpmChangeable =
    props.currentBpmIndex !== undefined &&
    props.currentLevel?.bpmChanges[props.currentBpmIndex] &&
    props.currentLevel?.bpmChanges[props.currentBpmIndex].luaLine !== null;
  const speedChangeable =
    props.currentSpeedIndex !== undefined &&
    props.currentLevel?.speedChanges[props.currentSpeedIndex] &&
    props.currentLevel?.speedChanges[props.currentSpeedIndex].luaLine !== null;
  const signatureChangeable =
    props.currentSignature && props.currentSignature.luaLine !== null;

  const ss =
    props.currentLevel &&
    getSignatureState(props.currentLevel.signature, props.currentStep);
  const currentBarLength =
    props.currentSignature && getBarLength(props.currentSignature);
  const prevBarLength =
    props.prevSignature && getBarLength(props.prevSignature);

  return (
    <>
      <div className="mb-3">
        <span>{t("offset")}</span>
        <HelpIcon>{t.rich("offsetHelp", { br: () => <br /> })}</HelpIcon>
        <Input
          className="w-16"
          actualValue={
            props.offset !== undefined ? props.offset.toString() : ""
          }
          updateValue={(v: string) => props.setOffset(Number(v))}
          isValid={offsetValid}
        />
        <span>{t("offsetSecond")}</span>
      </div>
      <div>
        <span>{t("ytBegin")}</span>
        <HelpIcon>{t.rich("ytBeginHelp", { br: () => <br /> })}</HelpIcon>
        <Input
          className="w-16"
          actualValue={props.currentLevel?.ytBegin.toString() || ""}
          updateValue={(v: string) => props.setYTBegin(Number(v))}
          isValid={offsetValid}
        />
        <span>{t("offsetSecond")}</span>
      </div>
      <div className="mb-3">
        <span>{t("ytEnd")}</span>
        <HelpIcon>{t.rich("ytEndHelp", { br: () => <br /> })}</HelpIcon>
        <CheckBox
          value={props.currentLevel?.ytEnd === "note"}
          className={clsx("ml-2")}
          onChange={() => props.setYTEnd("note")}
        >
          {t("ytEndAuto")}
          <span className="text-sm ml-1">
            ({Math.round(props.currentLevelLength * 10) / 10}{" "}
            {t("offsetSecond")})
          </span>
        </CheckBox>
        <CheckBox
          value={props.currentLevel?.ytEnd === "yt"}
          className={clsx("ml-2")}
          onChange={() => props.setYTEnd("yt")}
        >
          {t("ytEndFull")}
          <span className="text-sm ml-1">
            ({Math.round(props.ytDuration * 10) / 10} {t("offsetSecond")})
          </span>
        </CheckBox>
        <CheckBox
          value={typeof props.currentLevel?.ytEnd === "number"}
          className={clsx("ml-2")}
          onChange={() => props.setYTEnd(props.currentLevel?.ytEndSec || 0)}
        >
          {t("ytEndAt")}
          <Input
            className="w-16"
            actualValue={(
              Math.round((props.currentLevel?.ytEndSec || 0) * 10) / 10
            ).toString()}
            updateValue={(v: string) => props.setYTEnd(Number(v))}
            isValid={ytEndValid}
            disabled={typeof props.currentLevel?.ytEnd !== "number"}
          />
          <span>{t("offsetSecond")}</span>
        </CheckBox>
      </div>
      <div className="mb-3">
        <CheckBox value={props.enableSE} onChange={(v) => props.setEnableSE(v)}>
          {t("se")}
          <VolumeNotice
            theme="filled"
            className={clsx(
              "inline-block align-middle ml-2",
              props.enableSE || "text-slate-400 dark:text-stone-600"
            )}
          />
          <span
            className={clsx(
              "inline-block text-sm w-8 text-center",
              props.enableSE || "text-slate-400 dark:text-stone-600"
            )}
          >
            {props.seVolume}
          </span>
        </CheckBox>
        <input
          type="range"
          className="align-middle "
          min={0}
          max={100}
          disabled={!props.enableSE}
          value={props.seVolume}
          onChange={(e) => props.setSEVolume(parseInt(e.target.value))}
        />
      </div>
      <div>
        <span>{t("step")}</span>
        <HelpIcon>{t.rich("stepHelp", { br: () => <br /> })}</HelpIcon>
        <span className="inline-block text-right w-6">
          {ss && ss.barNum + 1}
        </span>
        <span className="ml-1 ">;</span>
        <span className="inline-block text-right w-6">
          {ss && ss.count.fourth + 1}
        </span>
        <div className="w-20 inline-block">
          {ss && ss.count.numerator > 0 && (
            <>
              <span className="ml-2 ">+</span>
              <span className="inline-block text-right w-6">
                {ss?.count.numerator}
              </span>
              <span className="ml-1 mr-1">/</span>
              <span>{ss && ss.count.denominator * 4}</span>
            </>
          )}
        </div>
      </div>
      <div className="ml-2">
        <span>{t("bpm")}</span>
        <HelpIcon>{t.rich("bpmHelp", { br: () => <br /> })}</HelpIcon>
        <Input
          className="w-16 ml-1"
          actualValue={
            props.bpmChangeHere
              ? props.prevBpm?.toString() || ""
              : props.currentBpm !== undefined
                ? props.currentBpm.toString()
                : ""
          }
          updateValue={(v: string) => {
            // bpmの変更時にspeedも変える
            if (
              !props.speedChangeHere &&
              props.currentBpm === props.currentSpeed
            ) {
              props.setCurrentBpm(Number(v), Number(v));
            } else {
              props.setCurrentBpm(Number(v), null);
            }
          }}
          disabled={props.bpmChangeHere || !bpmChangeable}
          isValid={bpmValid}
        />
        <span className="inline-block ml-1">
          <span>→</span>
          <CheckBox
            className="ml-4 mr-1"
            value={props.bpmChangeHere}
            onChange={() => {
              // bpmの変更時にspeedも変える
              if (props.currentBpm == props.currentSpeed) {
                props.toggleBpmChangeHere(
                  !props.bpmChangeHere,
                  !props.bpmChangeHere
                );
              } else {
                props.toggleBpmChangeHere(!props.bpmChangeHere, null);
              }
            }}
            disabled={stepCmp(props.currentStep, stepZero()) <= 0}
          >
            {t("changeHere")}
          </CheckBox>
          <Input
            className="w-16 mx-1"
            actualValue={props.currentBpm?.toString() || ""}
            updateValue={(v: string) => {
              // bpmの変更時にspeedも変える
              if (
                props.speedChangeHere &&
                props.currentBpm === props.currentSpeed
              ) {
                props.setCurrentBpm(Number(v), Number(v));
              } else {
                props.setCurrentBpm(Number(v), null);
              }
            }}
            disabled={!props.bpmChangeHere || !bpmChangeable}
            isValid={bpmValid}
          />
        </span>
        {props.currentBpmIndex !== undefined &&
          props.currentLevel?.bpmChanges[props.currentBpmIndex] &&
          !bpmChangeable && (
            <span className="ml-2 text-sm inline-block">
              {t("editedInCode")}
            </span>
          )}
      </div>
      <div className="ml-2">
        <span>{t("speed")}</span>
        <HelpIcon>
          <p>{t.rich("speedHelp1", { br: () => <br /> })}</p>
          <p className="mt-2">{t.rich("speedHelp2", { br: () => <br /> })}</p>
          <p className="mt-2">{t.rich("speedHelp3", { br: () => <br /> })}</p>
        </HelpIcon>
        <Input
          className="w-16 ml-1"
          actualValue={
            props.speedChangeHere
              ? props.prevSpeed?.toString() || ""
              : props.currentSpeed !== undefined
                ? props.currentSpeed.toString()
                : ""
          }
          updateValue={(v: string) => props.setCurrentBpm(null, Number(v))}
          disabled={props.speedChangeHere || !speedChangeable}
          isValid={speedValid}
        />
        <span className="inline-block ml-1">
          <span>→</span>
          <CheckBox
            className="ml-4 mr-1"
            value={props.speedChangeHere}
            onChange={() =>
              props.toggleBpmChangeHere(null, !props.speedChangeHere)
            }
            disabled={stepCmp(props.currentStep, stepZero()) <= 0}
          >
            {t("changeHere")}
          </CheckBox>
          <Input
            className="w-16 mx-1"
            actualValue={props.currentSpeed?.toString() || ""}
            updateValue={(v: string) => props.setCurrentBpm(null, Number(v))}
            disabled={!props.speedChangeHere || !speedChangeable}
            isValid={speedValid}
          />
        </span>
        {props.currentSpeedIndex !== undefined &&
          props.currentLevel?.speedChanges[props.currentSpeedIndex] &&
          !speedChangeable && (
            <span className="ml-2 text-sm inline-block">
              {t("editedInCode")}
            </span>
          )}
      </div>
      <div className="ml-2">
        <span>{t("beat")}</span>
        <HelpIcon>
          <p>{t.rich("beatHelp1", { br: () => <br /> })}</p>
          <p className="mt-2">{t.rich("beatHelp2", { br: () => <br /> })}</p>
        </HelpIcon>
        <span className="inline-block">
          <span className="ml-2">
            {props.signatureChangeHere
              ? prevBarLength &&
                stepImproper(
                  prevBarLength.reduce(
                    (len, bl) => stepAdd(len, bl),
                    stepZero()
                  )
                )
              : currentBarLength &&
                stepImproper(
                  currentBarLength.reduce(
                    (len, bl) => stepAdd(len, bl),
                    stepZero()
                  )
                )}
          </span>
          <span className="mx-1">/</span>
          <span className="">
            {props.signatureChangeHere
              ? prevBarLength &&
                prevBarLength.reduce((len, bl) => stepAdd(len, bl), stepZero())
                  .denominator * 4
              : currentBarLength &&
                currentBarLength.reduce(
                  (len, bl) => stepAdd(len, bl),
                  stepZero()
                ).denominator * 4}
          </span>
        </span>
        <span className="inline-block ml-1">
          <span>→</span>
          <CheckBox
            className="ml-4 mr-1"
            value={props.signatureChangeHere}
            onChange={() => {
              props.toggleSignatureChangeHere();
            }}
            disabled={stepCmp(props.currentStep, stepZero()) <= 0}
          >
            {t("changeHere")}
          </CheckBox>
        </span>
        {props.signatureChangeHere && currentBarLength && (
          <>
            <span className="ml-2">
              {stepImproper(
                currentBarLength.reduce(
                  (len, bl) => stepAdd(len, bl),
                  stepZero()
                )
              )}
            </span>
            <span className="mx-1">/</span>
            <span className="">
              {currentBarLength.reduce(
                (len, bl) => stepAdd(len, bl),
                stepZero()
              ).denominator * 4}
            </span>
            <span className="inline-block ml-2 text-sm">
              <span>({t("beatOffset")}:</span>
              <InputSig
                className="text-sm"
                allowZero
                actualValue={props.currentSignature?.offset}
                updateValue={(v: Step) =>
                  props.currentSignature &&
                  props.setCurrentSignature({
                    ...props.currentSignature,
                    offset: v,
                  })
                }
                disabled={!signatureChangeable}
              />
              <span>)</span>
            </span>
          </>
        )}
      </div>
      <ul className="list-disc ml-2 pl-6">
        {props.currentSignature?.bars.map((bar, i) => (
          <li className="w-full" key={i}>
            <div className="flex flex-row w-full items-baseline ">
              <InputSig
                limitedDenominator
                actualValue={currentBarLength![i]}
                updateValue={(newSig: Step) => {
                  const currentSig = currentBarLength![i];
                  let newBar: (4 | 8 | 16)[];
                  if (stepCmp(newSig, currentSig) >= 0) {
                    newBar = bar.concat(
                      barFromLength(stepSub(newSig, currentSig))
                    );
                  } else {
                    newBar = barFromLength(newSig);
                  }
                  props.setCurrentSignature({
                    ...props.currentSignature!,
                    bars: props.currentSignature!.bars.map((b, j) =>
                      i === j ? newBar : b
                    ),
                  });
                }}
                disabled={!signatureChangeable}
              />
              <span
                className="shrink grow-0 text-right min-w-max "
                style={{
                  width:
                    currentBarLength!.reduce(
                      (max, len) => Math.max(max, stepToFloat(len)),
                      0
                    ) *
                      2 *
                      2 +
                    "rem",
                }}
              >
                {bar
                  .slice()
                  .reverse()
                  .map((bs, j) => (
                    <button
                      key={j}
                      className="rounded-full hover:bg-slate-200 active:bg-slate-300 p-1 "
                      onClick={() => {
                        const countIndex = bar.length - 1 - j;
                        while (true) {
                          switch (bs) {
                            case 4:
                              bs = 8;
                              break;
                            case 8:
                              bs = 16;
                              break;
                            case 16:
                              bs = 4;
                              break;
                          }
                          const remainingSig = stepSub(
                            toStepArray(props.currentSignature!)
                              [i].slice(countIndex)
                              .reduce(
                                (len, bs) => stepAdd(len, bs),
                                stepZero()
                              ),
                            stepSimplify({
                              fourth: 0,
                              numerator: 1,
                              denominator: bs / 4,
                            })
                          );
                          if (stepCmp(remainingSig, stepZero()) >= 0) {
                            const newBar = bar
                              .slice(0, countIndex)
                              .concat([bs])
                              .concat(barFromLength(remainingSig));
                            props.setCurrentSignature({
                              ...props.currentSignature!,
                              bars: props.currentSignature!.bars.map((b, k) =>
                                i === k ? newBar : b
                              ),
                            });
                            return;
                          }
                        }
                      }}
                      disabled={!signatureChangeable}
                    >
                      <BeatSlime size={bs} />
                    </button>
                  ))}
              </span>
              <button
                className="inline-block self-end ml-2 p-2 rounded-full hover:bg-slate-200 active:bg-slate-300 "
                onClick={() => {
                  props.setCurrentSignature({
                    ...props.currentSignature!,
                    bars: props
                      .currentSignature!.bars.slice(0, i + 1)
                      .concat([[4, 4, 4, 4]])
                      .concat(props.currentSignature!.bars.slice(i + 1)),
                  });
                }}
                disabled={!signatureChangeable}
              >
                <CornerDownLeft />
              </button>
              <button
                className="inline-block self-end ml-2 p-2 rounded-full hover:bg-slate-200 active:bg-slate-300 disabled:text-slate-400"
                onClick={() => {
                  props.setCurrentSignature({
                    ...props.currentSignature!,
                    bars: props.currentSignature!.bars.filter(
                      (_, k) => k !== i
                    ),
                  });
                }}
                disabled={
                  props.currentSignature!.bars.length <= 1 ||
                  !signatureChangeable
                }
              >
                <Close />
              </button>
              {i === 0 && (
                <HelpIcon className="self-center">
                  <p>
                    {t.rich("beatBarHelp1", {
                      br: () => <br />,
                      slime: (c) => (
                        <BeatSlime size={Number(c) as 4 | 8 | 16} />
                      ),
                    })}
                  </p>
                  <p className="mt-2">
                    {t.rich("beatBarHelp2", {
                      br: () => <br />,
                      slime: (c) => (
                        <BeatSlime size={Number(c) as 4 | 8 | 16} />
                      ),
                    })}
                  </p>
                  <p className="mt-2">
                    {t.rich("beatBarHelp3", {
                      br: () => <br />,
                      slime: (c) => (
                        <BeatSlime size={Number(c) as 4 | 8 | 16} />
                      ),
                      add: () => (
                        <CornerDownLeft className="inline-block align-middle" />
                      ),
                    })}
                  </p>
                </HelpIcon>
              )}
            </div>
          </li>
        ))}
      </ul>
      {props.currentSignature !== undefined && !signatureChangeable && (
        <p className="text-sm">{t("editedInCode")}</p>
      )}
    </>
  );
}

interface PropsS {
  className?: string;
  actualValue?: Step;
  updateValue: (v: Step) => void;
  limitedDenominator?: boolean;
  allowZero?: boolean;
  disabled?: boolean;
}
function InputSig(props: PropsS) {
  const [num, setNum] = useState<number>(0);
  const [denom, setDenom] = useState<number>(1);
  const prevValue = useRef<Step>(undefined);
  useEffect(() => {
    const currentState = {
      fourth: 0,
      numerator: num,
      denominator: denom,
    };
    if (
      props.actualValue &&
      (!prevValue.current ||
        stepCmp(props.actualValue, prevValue.current) !== 0) &&
      stepCmp(props.actualValue, currentState) !== 0
    ) {
      setNum(stepImproper(props.actualValue));
      setDenom(props.actualValue.denominator);
    }
    prevValue.current = props.actualValue;
  }, [props, denom, num]);
  const beatNumValid = (v: string) =>
    !isNaN(Number(v)) &&
    Number(v) >= 0 &&
    Math.floor(Number(v)) == Number(v) &&
    (props.allowZero || Number(v) > 0);
  const beatDenomValid = (v: string) =>
    !isNaN(Number(v)) &&
    Number(v) > 0 &&
    Math.floor(Number(v) / 4) == Number(v) / 4 &&
    !(props.limitedDenominator && ![4, 8, 16].includes(Number(v)));

  return (
    <>
      <Input
        className={clsx("w-8", props.className)}
        actualValue={num.toString()}
        updateValue={(v: string) => {
          props.updateValue(
            stepSimplify({
              fourth: 0,
              numerator: Number(v),
              denominator: denom,
            })
          );
          setNum(Number(v));
        }}
        isValid={beatNumValid}
        disabled={props.disabled}
      />
      <span className={clsx("mx-1", props.className)}>/</span>
      <Input
        className={clsx("w-8", props.className)}
        actualValue={(denom * 4).toString()}
        updateValue={(v: string) => {
          props.updateValue(
            stepSimplify({
              fourth: 0,
              numerator: num,
              denominator: Number(v) / 4,
            })
          );
          setDenom(Number(v) / 4);
        }}
        isValid={beatDenomValid}
        disabled={props.disabled}
      />
    </>
  );
}

export function BeatSlime(props: { size: 4 | 8 | 16 }) {
  return (
    <img
      src={process.env.ASSET_PREFIX + "/assets/slime2.svg"}
      className="inline-block"
      style={{
        width:
          (props.size === 4 ? 1 : props.size === 8 ? 0.75 : 0.5) * 2 + "rem",
      }}
    />
  );
}
