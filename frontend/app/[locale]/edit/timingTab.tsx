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
import Range from "@/common/range";
import SmilingFace from "@icon-park/react/lib/icons/SmilingFace";
import { ChartEditing } from "./chartState";

interface Props {
  chart?: ChartEditing;
  enableHitSE: boolean;
  setEnableHitSE: (enableSE: boolean) => void;
  hitVolume: number;
  setHitVolume: (seVolume: number) => void;
  enableBeatSE: boolean;
  setEnableBeatSE: (enableSE: boolean) => void;
  beatVolume: number;
  setBeatVolume: (seVolume: number) => void;
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
    props.chart?.currentLevel !== undefined &&
    Number(offset) >= props.chart.currentLevel.lengthSec &&
    Number(offset) <= props.chart.currentLevel.ytDuration;

  const bpmChangeable =
    props.chart?.currentLevel?.freeze.bpmChanges.at(
      props.chart.currentLevel.current.bpmIndex
    ) &&
    props.chart.currentLevel.freeze.bpmChanges.at(
      props.chart.currentLevel.current.bpmIndex
    )!.luaLine !== null;
  const speedChangeable =
    props.chart?.currentLevel?.freeze.speedChanges.at(
      props.chart.currentLevel.current.speedIndex
    ) &&
    props.chart.currentLevel.freeze.speedChanges.at(
      props.chart.currentLevel.current.speedIndex
    )!.luaLine !== null;
  const signatureChangeable =
    props.chart?.currentLevel?.freeze.signature.at(
      props.chart.currentLevel.current.signatureIndex
    ) &&
    props.chart.currentLevel.freeze.signature.at(
      props.chart.currentLevel.current.signatureIndex
    )!.luaLine !== null;

  const currentBarLength =
    props.chart?.currentLevel?.currentSignature &&
    getBarLength(props.chart.currentLevel.currentSignature);
  const prevBarLength =
    props.chart?.currentLevel?.freeze.signature.at(
      props.chart.currentLevel.current.signatureIndex - 1
    ) &&
    getBarLength(
      props.chart.currentLevel.freeze.signature.at(
        props.chart.currentLevel.current.signatureIndex - 1
      )!
    );

  return (
    <>
      <div className="mb-3">
        <span>{t("offset")}</span>
        <HelpIcon>{t.rich("offsetHelp", { br: () => <br /> })}</HelpIcon>
        <Input
          className="w-16"
          actualValue={
            props.chart?.offset !== undefined
              ? props.chart.offset.toString()
              : ""
          }
          updateValue={(v: string) => props.chart?.setOffset(Number(v))}
          isValid={offsetValid}
        />
        <span>{t("offsetSecond")}</span>
      </div>
      <div>
        <span>{t("ytBegin")}</span>
        <HelpIcon>{t.rich("ytBeginHelp", { br: () => <br /> })}</HelpIcon>
        <Input
          className="w-16"
          actualValue={props.chart?.currentLevel?.meta.ytBegin.toString() || ""}
          updateValue={(v: string) =>
            props.chart?.currentLevel?.updateMeta({ ytBegin: Number(v) })
          }
          isValid={offsetValid}
        />
        <span>{t("offsetSecond")}</span>
      </div>
      <div className="mb-3">
        <span>{t("ytEnd")}</span>
        <HelpIcon>{t.rich("ytEndHelp", { br: () => <br /> })}</HelpIcon>
        <CheckBox
          value={props.chart?.currentLevel?.meta.ytEnd === "note"}
          className={clsx("ml-2")}
          onChange={() =>
            props.chart?.currentLevel?.updateMeta({ ytEnd: "note" })
          }
        >
          {t("ytEndAuto")}
          <span className="text-sm ml-1">
            ({Math.round((props.chart?.currentLevel?.lengthSec || 0) * 10) / 10}{" "}
            {t("offsetSecond")})
          </span>
        </CheckBox>
        <CheckBox
          value={props.chart?.currentLevel?.meta.ytEnd === "yt"}
          className={clsx("ml-2")}
          onChange={() =>
            props.chart?.currentLevel?.updateMeta({ ytEnd: "yt" })
          }
        >
          {t("ytEndFull")}
          <span className="text-sm ml-1">
            (
            {Math.round((props.chart?.currentLevel?.ytDuration || 0) * 10) / 10}{" "}
            {t("offsetSecond")})
          </span>
        </CheckBox>
        <CheckBox
          value={typeof props.chart?.currentLevel?.meta.ytEnd === "number"}
          className={clsx("ml-2")}
          onChange={() =>
            props.chart?.currentLevel?.updateMeta({
              ytEnd: props.chart?.currentLevel?.meta.ytEndSec || 0,
            })
          }
        >
          {t("ytEndAt")}
          <Input
            className="w-16"
            actualValue={(
              Math.round((props.chart?.currentLevel?.meta.ytEndSec || 0) * 10) /
              10
            ).toString()}
            updateValue={(v: string) =>
              props.chart?.currentLevel?.updateMeta({ ytEnd: Number(v) })
            }
            isValid={ytEndValid}
            disabled={typeof props.chart?.currentLevel?.meta.ytEnd !== "number"}
          />
          <span>{t("offsetSecond")}</span>
        </CheckBox>
      </div>
      <div className="">
        <CheckBox
          value={props.enableHitSE}
          onChange={(v) => props.setEnableHitSE(v)}
        >
          <SmilingFace className={clsx("inline-block align-middle mr-1")} />
          {t("se")}
          <VolumeNotice
            theme="filled"
            className={clsx(
              "inline-block align-middle ml-2",
              props.enableHitSE || "text-slate-400 dark:text-stone-600"
            )}
          />
          <span
            className={clsx(
              "inline-block text-sm w-8 text-center",
              props.enableHitSE || "text-slate-400 dark:text-stone-600"
            )}
          >
            {props.hitVolume}
          </span>
        </CheckBox>
        <Range
          className="align-middle "
          min={0}
          max={100}
          disabled={!props.enableHitSE}
          value={props.hitVolume}
          onChange={props.setHitVolume}
        />
      </div>
      <div className="mb-3">
        <CheckBox
          value={props.enableBeatSE}
          onChange={(v) => props.setEnableBeatSE(v)}
        >
          {t("beatSE")}
          <VolumeNotice
            theme="filled"
            className={clsx(
              "inline-block align-middle ml-2",
              props.enableBeatSE || "text-slate-400 dark:text-stone-600"
            )}
          />
          <span
            className={clsx(
              "inline-block text-sm w-8 text-center",
              props.enableBeatSE || "text-slate-400 dark:text-stone-600"
            )}
          >
            {props.beatVolume}
          </span>
        </CheckBox>
        <Range
          className="align-middle "
          min={0}
          max={100}
          disabled={!props.enableBeatSE}
          value={props.beatVolume}
          onChange={props.setBeatVolume}
        />
      </div>
      <div>
        <span>{t("step")}</span>
        <HelpIcon>{t.rich("stepHelp", { br: () => <br /> })}</HelpIcon>
        <span className="inline-block text-right w-6">
          {(props.chart?.currentLevel?.current.signatureState.barNum || 0) + 1}
        </span>
        <span className="ml-1 ">;</span>
        <span className="inline-block text-right w-6">
          {(props.chart?.currentLevel?.current.signatureState.count.fourth ||
            0) + 1}
        </span>
        <div className="w-20 inline-block">
          {props.chart?.currentLevel &&
            props.chart?.currentLevel?.current.signatureState.count.numerator >
              0 && (
              <>
                <span className="ml-2 ">+</span>
                <span className="inline-block text-right w-6">
                  {
                    props.chart?.currentLevel.current.signatureState?.count
                      .numerator
                  }
                </span>
                <span className="ml-1 mr-1">/</span>
                <span>
                  {props.chart?.currentLevel?.current.signatureState.count
                    .denominator * 4}
                </span>
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
            props.chart?.currentLevel?.bpmChangeHere
              ? props.chart.currentLevel.freeze.bpmChanges
                  .at(props.chart.currentLevel.current.bpmIndex - 1)
                  ?.toString() || ""
              : props.chart?.currentLevel?.currentBpm !== undefined
                ? props.chart?.currentLevel?.currentBpm.toString()
                : ""
          }
          updateValue={(v: string) => {
            // bpmの変更時にspeedも変える
            if (
              !props.chart?.currentLevel?.speedChangeHere &&
              props.chart?.currentLevel?.currentBpm ===
                props.chart?.currentLevel?.currentSpeed &&
              !props.chart?.currentLevel?.currentSpeedInterp
            ) {
              props.chart?.currentLevel?.changeBpm(Number(v), Number(v), false);
            } else {
              props.chart?.currentLevel?.changeBpm(Number(v), null, false);
            }
          }}
          disabled={props.chart?.currentLevel?.bpmChangeHere || !bpmChangeable}
          isValid={bpmValid}
        />
        <span className="inline-block ml-1">
          <span>→</span>
          <CheckBox
            className="ml-4 mr-1"
            value={!!props.chart?.currentLevel?.bpmChangeHere}
            onChange={() => {
              // bpmの変更時にspeedも変える
              if (
                props.chart?.currentLevel?.currentBpm ==
                props.chart?.currentLevel?.currentSpeed
              ) {
                props.chart?.currentLevel?.toggleBpmChangeHere(
                  !props.chart?.currentLevel?.bpmChangeHere,
                  !props.chart?.currentLevel?.bpmChangeHere
                );
              } else {
                props.chart?.currentLevel?.toggleBpmChangeHere(
                  !props.chart?.currentLevel?.bpmChangeHere,
                  null
                );
              }
            }}
            disabled={
              props.chart?.currentLevel &&
              stepCmp(props.chart?.currentLevel?.current.step, stepZero()) <= 0
            }
          >
            {t("changeHere")}
          </CheckBox>
          <Input
            className="w-16 mx-1"
            actualValue={
              props.chart?.currentLevel?.currentBpm?.toString() || ""
            }
            updateValue={(v: string) => {
              // bpmの変更時にspeedも変える
              if (
                props.chart?.currentLevel?.speedChangeHere &&
                props.chart?.currentLevel?.currentBpm ===
                  props.chart?.currentLevel?.currentSpeed &&
                !props.chart?.currentLevel?.currentSpeedInterp
              ) {
                props.chart?.currentLevel?.changeBpm(
                  Number(v),
                  Number(v),
                  false
                );
              } else {
                props.chart?.currentLevel?.changeBpm(Number(v), null, false);
              }
            }}
            disabled={
              !props.chart?.currentLevel?.bpmChangeHere || !bpmChangeable
            }
            isValid={bpmValid}
          />
        </span>
        {props.chart?.currentLevel?.current.bpmIndex !== undefined &&
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
            props.chart?.currentLevel?.speedChangeHere
              ? props.chart?.currentLevel?.freeze.speedChanges
                  .at(props.chart?.currentLevel?.current.speedIndex - 1)
                  ?.toString() || ""
              : props.chart?.currentLevel?.currentSpeed !== undefined
                ? props.chart.currentLevel.currentSpeed.toString()
                : ""
          }
          updateValue={(v: string) =>
            props.chart?.currentLevel?.changeBpm(
              null,
              Number(v),
              !!props.chart.currentLevel.currentSpeedInterp
            )
          }
          disabled={
            props.chart?.currentLevel?.speedChangeHere || !speedChangeable
          }
          isValid={speedValid}
        />
        <span className="inline-block ml-1">
          <span>→</span>
          <CheckBox
            className="ml-4 mr-1"
            value={!!props.chart?.currentLevel?.speedChangeHere}
            onChange={() =>
              props.chart?.currentLevel?.toggleBpmChangeHere(
                null,
                !props.chart?.currentLevel?.speedChangeHere
              )
            }
            disabled={
              props.chart?.currentLevel &&
              stepCmp(props.chart?.currentLevel?.current.step, stepZero()) <= 0
            }
          >
            {t("changeHere")}
          </CheckBox>
          <CheckBox
            className="mr-1"
            value={
              !!props.chart?.currentLevel?.speedChangeHere &&
              !!props.chart?.currentLevel?.currentSpeedInterp
            }
            onChange={() =>
              props.chart?.currentLevel?.currentSpeed &&
              props.chart?.currentLevel?.changeBpm(
                null,
                props.chart?.currentLevel?.currentSpeed,
                !props.chart?.currentLevel?.currentSpeedInterp
              )
            }
            disabled={
              !props.chart?.currentLevel?.speedChangeHere ||
              !speedChangeable ||
              !props.chart?.currentLevel?.current.speedIndex ||
              props.chart?.currentLevel?.current.speedIndex <= 0
            }
          >
            {t("interp")}
          </CheckBox>
          <Input
            className="w-16 mx-1"
            actualValue={
              props.chart?.currentLevel?.currentSpeed?.toString() || ""
            }
            updateValue={(v: string) =>
              props.chart?.currentLevel?.changeBpm(
                null,
                Number(v),
                !!props.chart?.currentLevel?.currentSpeedInterp
              )
            }
            disabled={
              !props.chart?.currentLevel?.speedChangeHere || !speedChangeable
            }
            isValid={speedValid}
          />
        </span>
        {props.chart?.currentLevel?.current.speedIndex !== undefined &&
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
            {props.chart?.currentLevel?.signatureChangeHere
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
            {props.chart?.currentLevel?.signatureChangeHere
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
            value={!!props.chart?.currentLevel?.signatureChangeHere}
            onChange={() => {
              props.chart?.currentLevel?.toggleSignatureChangeHere();
            }}
            disabled={
              props.chart?.currentLevel &&
              stepCmp(props.chart?.currentLevel?.current.step, stepZero()) <= 0
            }
          >
            {t("changeHere")}
          </CheckBox>
        </span>
        {props.chart?.currentLevel?.signatureChangeHere && currentBarLength && (
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
                actualValue={
                  props.chart?.currentLevel?.currentSignature?.offset
                }
                updateValue={(v: Step) =>
                  props.chart?.currentLevel?.currentSignature &&
                  props.chart?.currentLevel?.changeSignature({
                    ...props.chart?.currentLevel?.currentSignature,
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
        {props.chart?.currentLevel?.currentSignature?.bars.map((bar, i) => (
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
                  props.chart?.currentLevel?.changeSignature({
                    ...props.chart?.currentLevel?.currentSignature!,
                    bars: props.chart?.currentLevel?.currentSignature!.bars.map(
                      (b, j) => (i === j ? newBar : b)
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
                            toStepArray(
                              props.chart?.currentLevel?.currentSignature!
                            )
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
                            props.chart?.currentLevel?.changeSignature({
                              ...props.chart?.currentLevel?.currentSignature!,
                              bars: props.chart?.currentLevel?.currentSignature!.bars.map(
                                (b, k) => (i === k ? newBar : b)
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
                  props.chart?.currentLevel?.changeSignature({
                    ...props.chart?.currentLevel?.currentSignature!,
                    bars: props.chart?.currentLevel
                      ?.currentSignature!.bars.slice(0, i + 1)
                      .concat([[4, 4, 4, 4]])
                      .concat(
                        props.chart?.currentLevel?.currentSignature!.bars.slice(
                          i + 1
                        )
                      ),
                  });
                }}
                disabled={!signatureChangeable}
              >
                <CornerDownLeft />
              </button>
              <button
                className="inline-block self-end ml-2 p-2 rounded-full hover:bg-slate-200 active:bg-slate-300 disabled:text-slate-400"
                onClick={() => {
                  props.chart?.currentLevel?.changeSignature({
                    ...props.chart?.currentLevel?.currentSignature!,
                    bars: props.chart?.currentLevel?.currentSignature!.bars.filter(
                      (_, k) => k !== i
                    ),
                  });
                }}
                disabled={
                  (props.chart?.currentLevel &&
                    props.chart?.currentLevel?.currentSignature!.bars.length <=
                      1) ||
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
      {props.chart?.currentLevel?.currentSignature !== undefined &&
        !signatureChangeable && <p className="text-sm">{t("editedInCode")}</p>}
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
