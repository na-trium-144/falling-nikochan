"use client";

import clsx from "clsx/lite";
import Input from "@/common/input.js";
import {
  ChartEditing,
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
import {
  barFromLength,
  getBarLength,
  toStepArray,
} from "@falling-nikochan/chart";
import { useEffect, useRef, useState } from "react";
import Close from "@icon-park/react/lib/icons/Close";
import CornerDownLeft from "@icon-park/react/lib/icons/CornerDownLeft";
import { useTranslations } from "next-intl";
import { HelpIcon } from "@/common/caption";
import VolumeNotice from "@icon-park/react/lib/icons/VolumeNotice";
import Range from "@/common/range";
import SmilingFace from "@icon-park/react/lib/icons/SmilingFace";

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
  const { chart } = props;
  const currentLevel = chart?.currentLevel;
  const cur = currentLevel?.current;
  const t = useTranslations("edit.timing");

  const offsetValid = (offset: string) =>
    offset !== "" && !isNaN(Number(offset)) && Number(offset) >= 0;
  const bpmValid = (bpm: string) =>
    bpm !== "" && !isNaN(Number(bpm)) && Number(bpm) > 0;
  const speedValid = (bpm: string) => bpm !== "" && !isNaN(Number(bpm));
  const ytEndValid = (offset: string) =>
    offset !== "" &&
    !isNaN(Number(offset)) &&
    currentLevel !== undefined &&
    Number(offset) >= currentLevel.lengthSec &&
    Number(offset) <= currentLevel.ytDuration;

  const currentBarLength =
    currentLevel?.currentSignature &&
    getBarLength(currentLevel.currentSignature);
  const prevBarLength =
    currentLevel?.prevSignature && getBarLength(currentLevel.prevSignature);

  return (
    <>
      <div className="mb-3">
        <span>{t("offset")}</span>
        <HelpIcon>{t.rich("offsetHelp", { br: () => <br /> })}</HelpIcon>
        <Input
          className="w-16"
          actualValue={
            chart?.offset !== undefined ? chart.offset.toString() : ""
          }
          updateValue={(v: string) => chart?.setOffset(Number(v))}
          isValid={offsetValid}
        />
        <span>{t("offsetSecond")}</span>
      </div>
      <div>
        <span>{t("ytBegin")}</span>
        <HelpIcon>{t.rich("ytBeginHelp", { br: () => <br /> })}</HelpIcon>
        <Input
          className="w-16"
          actualValue={currentLevel?.meta.ytBegin.toString() || ""}
          updateValue={(v: string) =>
            currentLevel?.updateMeta({ ytBegin: Number(v) })
          }
          isValid={offsetValid}
        />
        <span>{t("offsetSecond")}</span>
      </div>
      <div className="mb-3">
        <span>{t("ytEnd")}</span>
        <HelpIcon>{t.rich("ytEndHelp", { br: () => <br /> })}</HelpIcon>
        <CheckBox
          value={currentLevel?.meta.ytEnd === "note"}
          className={clsx("ml-2")}
          onChange={() => currentLevel?.updateMeta({ ytEnd: "note" })}
        >
          {t("ytEndAuto")}
          <span className="text-sm ml-1">
            ({Math.round((currentLevel?.lengthSec || 0) * 10) / 10}{" "}
            {t("offsetSecond")})
          </span>
        </CheckBox>
        <CheckBox
          value={currentLevel?.meta.ytEnd === "yt"}
          className={clsx("ml-2")}
          onChange={() => currentLevel?.updateMeta({ ytEnd: "yt" })}
        >
          {t("ytEndFull")}
          <span className="text-sm ml-1">
            ({Math.round((currentLevel?.ytDuration || 0) * 10) / 10}{" "}
            {t("offsetSecond")})
          </span>
        </CheckBox>
        <CheckBox
          value={typeof currentLevel?.meta.ytEnd === "number"}
          className={clsx("ml-2")}
          onChange={() =>
            currentLevel?.updateMeta({
              ytEnd: currentLevel?.meta.ytEndSec || 0,
            })
          }
        >
          {t("ytEndAt")}
          <Input
            className="w-16"
            actualValue={(
              Math.round((currentLevel?.meta.ytEndSec || 0) * 10) / 10
            ).toString()}
            updateValue={(v: string) =>
              currentLevel?.updateMeta({ ytEnd: Number(v) })
            }
            isValid={ytEndValid}
            disabled={typeof currentLevel?.meta.ytEnd !== "number"}
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
          {(cur?.signatureState.barNum || 0) + 1}
        </span>
        <span className="ml-1 ">;</span>
        <span className="inline-block text-right w-6">
          {(cur?.signatureState.count.fourth || 0) + 1}
        </span>
        <div className="w-20 inline-block">
          {cur && cur?.signatureState.count.numerator > 0 && (
            <>
              <span className="ml-2 ">+</span>
              <span className="inline-block text-right w-6">
                {cur.signatureState.count.numerator}
              </span>
              <span className="ml-1 mr-1">/</span>
              <span>{cur.signatureState.count.denominator * 4}</span>
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
            currentLevel?.bpmChangeHere
              ? currentLevel.prevBpm?.toString() || ""
              : currentLevel?.currentBpm !== undefined
                ? currentLevel?.currentBpm.toString()
                : ""
          }
          updateValue={(v: string) => {
            // bpmの変更時にspeedも変える
            if (
              !currentLevel?.speedChangeHere &&
              currentLevel?.currentBpm === currentLevel?.currentSpeed &&
              !currentLevel?.currentSpeedInterp
            ) {
              currentLevel?.changeBpm(Number(v), Number(v), false);
            } else {
              currentLevel?.changeBpm(Number(v), null, false);
            }
          }}
          disabled={
            currentLevel?.bpmChangeHere || !currentLevel?.currentBpmEditable
          }
          isValid={bpmValid}
        />
        <span className="inline-block ml-1">
          <span>→</span>
          <CheckBox
            className="ml-4 mr-1"
            value={!!currentLevel?.bpmChangeHere}
            onChange={() => {
              // bpmの変更時にspeedも変える
              if (currentLevel?.currentBpm == currentLevel?.currentSpeed) {
                currentLevel?.toggleBpmChangeHere(
                  !currentLevel?.bpmChangeHere,
                  !currentLevel?.bpmChangeHere
                );
              } else {
                currentLevel?.toggleBpmChangeHere(
                  !currentLevel?.bpmChangeHere,
                  null
                );
              }
            }}
            disabled={cur && stepCmp(cur.step, stepZero()) <= 0}
          >
            {t("changeHere")}
          </CheckBox>
          <Input
            className="w-16 mx-1"
            actualValue={currentLevel?.currentBpm?.toString() || ""}
            updateValue={(v: string) => {
              // bpmの変更時にspeedも変える
              if (
                currentLevel?.speedChangeHere &&
                currentLevel?.currentBpm === currentLevel?.currentSpeed &&
                !currentLevel?.currentSpeedInterp
              ) {
                currentLevel?.changeBpm(Number(v), Number(v), false);
              } else {
                currentLevel?.changeBpm(Number(v), null, false);
              }
            }}
            disabled={
              !currentLevel?.bpmChangeHere || !currentLevel?.currentBpmEditable
            }
            isValid={bpmValid}
          />
        </span>
        {cur && !currentLevel?.currentBpmEditable && (
          <span className="ml-2 text-sm inline-block">{t("editedInCode")}</span>
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
            currentLevel?.speedChangeHere
              ? currentLevel?.prevSpeed?.toString() || ""
              : currentLevel?.currentSpeed !== undefined
                ? currentLevel.currentSpeed.toString()
                : ""
          }
          updateValue={(v: string) =>
            currentLevel?.changeBpm(
              null,
              Number(v),
              !!currentLevel.currentSpeedInterp
            )
          }
          disabled={
            currentLevel?.speedChangeHere || !currentLevel?.currentSpeedEditable
          }
          isValid={speedValid}
        />
        <span className="inline-block ml-1">
          <span>→</span>
          <CheckBox
            className="ml-4 mr-1"
            value={!!currentLevel?.speedChangeHere}
            onChange={() =>
              currentLevel?.toggleBpmChangeHere(
                null,
                !currentLevel?.speedChangeHere
              )
            }
            disabled={cur && stepCmp(cur.step, stepZero()) <= 0}
          >
            {t("changeHere")}
          </CheckBox>
          <CheckBox
            className="mr-1"
            value={
              !!currentLevel?.speedChangeHere &&
              !!currentLevel?.currentSpeedInterp
            }
            onChange={() =>
              currentLevel?.currentSpeed &&
              currentLevel?.changeBpm(
                null,
                currentLevel?.currentSpeed,
                !currentLevel?.currentSpeedInterp
              )
            }
            disabled={
              !currentLevel?.speedChangeHere ||
              !currentLevel?.currentSpeedEditable ||
              !cur?.speedIndex ||
              cur.speedIndex <= 0
            }
          >
            {t("interp")}
          </CheckBox>
          <Input
            className="w-16 mx-1"
            actualValue={currentLevel?.currentSpeed?.toString() || ""}
            updateValue={(v: string) =>
              currentLevel?.changeBpm(
                null,
                Number(v),
                !!currentLevel?.currentSpeedInterp
              )
            }
            disabled={
              !currentLevel?.speedChangeHere ||
              !currentLevel?.currentSpeedEditable
            }
            isValid={speedValid}
          />
        </span>
        {cur && !currentLevel?.currentSpeedEditable && (
          <span className="ml-2 text-sm inline-block">{t("editedInCode")}</span>
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
            {currentLevel?.signatureChangeHere
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
            {currentLevel?.signatureChangeHere
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
            value={!!currentLevel?.signatureChangeHere}
            onChange={() => {
              currentLevel?.toggleSignatureChangeHere();
            }}
            disabled={cur && stepCmp(cur.step, stepZero()) <= 0}
          >
            {t("changeHere")}
          </CheckBox>
        </span>
        {currentLevel?.signatureChangeHere && currentBarLength && (
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
                actualValue={currentLevel?.currentSignature?.offset}
                updateValue={(v: Step) =>
                  currentLevel?.currentSignature &&
                  currentLevel?.changeSignature({
                    ...currentLevel?.currentSignature,
                    offset: v,
                  })
                }
                disabled={!currentLevel?.currentSignatureEditable}
              />
              <span>)</span>
            </span>
          </>
        )}
      </div>
      <ul className="list-disc-as-text ml-2">
        {currentLevel?.currentSignature?.bars.map((bar, i) => (
          <li className="flex flex-row w-full items-baseline" key={i}>
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
                currentLevel?.changeSignature({
                  ...currentLevel.currentSignature!,
                  bars: currentLevel?.currentSignature!.bars.map((b, j) =>
                    i === j ? newBar : b
                  ),
                });
              }}
              disabled={!currentLevel?.currentSignatureEditable}
            />
            <span
              className="shrink grow-0 text-right min-w-max "
              style={{
                flexBasis:
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
                          toStepArray(currentLevel.currentSignature!)
                            [i].slice(countIndex)
                            .reduce((len, bs) => stepAdd(len, bs), stepZero()),
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
                          currentLevel?.changeSignature({
                            ...currentLevel.currentSignature!,
                            bars: currentLevel?.currentSignature!.bars.map(
                              (b, k) => (i === k ? newBar : b)
                            ),
                          });
                          return;
                        }
                      }
                    }}
                    disabled={!currentLevel?.currentSignatureEditable}
                  >
                    <BeatSlime size={bs} />
                  </button>
                ))}
            </span>
            <button
              className="inline-block self-end ml-2 p-2 rounded-full hover:bg-slate-200 active:bg-slate-300 "
              onClick={() => {
                currentLevel?.changeSignature({
                  ...currentLevel.currentSignature!,
                  bars: currentLevel
                    ?.currentSignature!.bars.slice(0, i + 1)
                    .concat([[4, 4, 4, 4]])
                    .concat(currentLevel?.currentSignature!.bars.slice(i + 1)),
                });
              }}
              disabled={!currentLevel?.currentSignatureEditable}
            >
              <CornerDownLeft />
            </button>
            <button
              className="inline-block self-end ml-2 p-2 rounded-full hover:bg-slate-200 active:bg-slate-300 disabled:text-slate-400"
              onClick={() => {
                currentLevel?.changeSignature({
                  ...currentLevel.currentSignature!,
                  bars: currentLevel?.currentSignature!.bars.filter(
                    (_, k) => k !== i
                  ),
                });
              }}
              disabled={
                (currentLevel &&
                  currentLevel?.currentSignature!.bars.length <= 1) ||
                !currentLevel?.currentSignatureEditable
              }
            >
              <Close />
            </button>
            {i === 0 && (
              <HelpIcon className="self-center">
                <p>
                  {t.rich("beatBarHelp1", {
                    br: () => <br />,
                    slime: (c) => <BeatSlime size={Number(c) as 4 | 8 | 16} />,
                  })}
                </p>
                <p className="mt-2">
                  {t.rich("beatBarHelp2", {
                    br: () => <br />,
                    slime: (c) => <BeatSlime size={Number(c) as 4 | 8 | 16} />,
                  })}
                </p>
                <p className="mt-2">
                  {t.rich("beatBarHelp3", {
                    br: () => <br />,
                    slime: (c) => <BeatSlime size={Number(c) as 4 | 8 | 16} />,
                    add: () => (
                      <CornerDownLeft className="inline-block align-middle" />
                    ),
                  })}
                </p>
              </HelpIcon>
            )}
          </li>
        ))}
      </ul>
      {currentLevel && !currentLevel?.currentSignatureEditable && (
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
