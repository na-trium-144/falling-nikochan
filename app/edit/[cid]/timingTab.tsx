import Input from "@/common/input";
import {
  stepDenominator,
  stepFourth,
  stepMeasure,
  stepNumerator,
  stepStr,
} from "./str";
import { Step, stepCmp, stepZero } from "@/chartFormat/step";
import { Level } from "@/chartFormat/chart";
import CheckBox from "@/common/checkBox";

interface Props {
  offset?: number;
  setOffset: (offset: number) => void;
  prevBpm?: number;
  prevSpeed?: number;
  currentLevel?: Level;
  currentBpmIndex?: number;
  currentBpm?: number;
  setCurrentBpm: (bpm: number) => void;
  bpmChangeHere: boolean;
  toggleBpmChangeHere: () => void;
  currentSpeedIndex?: number;
  currentSpeed?: number;
  setCurrentSpeed: (bpm: number) => void;
  speedChangeHere: boolean;
  toggleSpeedChangeHere: () => void;
  currentStep: Step;
}
export default function TimingTab(props: Props) {
  const offsetValid = (offset: string) =>
    !isNaN(Number(offset)) && Number(offset) >= 0;
  const bpmValid = (bpm: string) => !isNaN(Number(bpm)) && Number(bpm) > 0;
  const speedValid = (bpm: string) => !isNaN(Number(bpm));

  const bpmChangeable =
    props.currentBpmIndex !== undefined &&
    props.currentLevel?.bpmChanges[props.currentBpmIndex] &&
    props.currentLevel?.bpmChanges[props.currentBpmIndex].luaLine !== null;
  const speedChangeable =
    props.currentSpeedIndex !== undefined &&
    props.currentLevel?.speedChanges[props.currentSpeedIndex] &&
    props.currentLevel?.speedChanges[props.currentSpeedIndex].luaLine !== null;

  return (
    <>
      <p className="mb-3">
        <span>Offset</span>
        <Input
          className="w-16"
          actualValue={
            props.offset !== undefined ? props.offset.toString() : ""
          }
          updateValue={(v: string) => props.setOffset(Number(v))}
          isValid={offsetValid}
        />
        <span>s</span>
      </p>
      <p>
        <span>Step</span>
        <span className="inline-block text-right w-6">
          {stepMeasure(props.currentStep)}
        </span>
        <span className="ml-1 ">;</span>
        <span className="inline-block text-right w-6">
          {stepFourth(props.currentStep)}
        </span>
        <div className="w-20 inline-block">
          {props.currentStep.numerator > 0 && (
            <>
              <span className="ml-2 ">+</span>
              <span className="inline-block text-right w-6">
                {stepNumerator(props.currentStep)}
              </span>
              <span className="ml-1 mr-1">/</span>
              <span>{stepDenominator(props.currentStep)}</span>
            </>
          )}
        </div>
      </p>
      <p className="ml-2">
        <span>BPM</span>
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
              props.setCurrentSpeed(Number(v));
            }
            props.setCurrentBpm(Number(v));
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
                props.toggleSpeedChangeHere();
              }
              props.toggleBpmChangeHere();
            }}
            disabled={stepCmp(props.currentStep, stepZero()) <= 0}
          >
            ここで変化
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
                props.setCurrentSpeed(Number(v));
              }
              props.setCurrentBpm(Number(v));
            }}
            disabled={!props.bpmChangeHere || !bpmChangeable}
            isValid={bpmValid}
          />
        </span>
        {props.currentBpmIndex !== undefined &&
          props.currentLevel?.bpmChanges[props.currentBpmIndex] &&
          !bpmChangeable && (
            <span className="ml-2 text-sm inline-block">
              Code タブで編集されているため変更できません。
            </span>
          )}
      </p>
      <p className="ml-2">
        <span>Speed</span>
        <Input
          className="w-16 ml-1"
          actualValue={
            props.speedChangeHere
              ? props.prevSpeed?.toString() || ""
              : props.currentSpeed !== undefined
              ? props.currentSpeed.toString()
              : ""
          }
          updateValue={(v: string) => props.setCurrentSpeed(Number(v))}
          disabled={props.speedChangeHere || !speedChangeable}
          isValid={speedValid}
        />
        <span className="inline-block ml-1">
          <span>→</span>
          <CheckBox
            className="ml-4 mr-1"
            value={props.speedChangeHere}
            onChange={props.toggleSpeedChangeHere}
            disabled={stepCmp(props.currentStep, stepZero()) <= 0}
          >
            ここで変化
          </CheckBox>
          <Input
            className="w-16 mx-1"
            actualValue={props.currentSpeed?.toString() || ""}
            updateValue={(v: string) => props.setCurrentSpeed(Number(v))}
            disabled={!props.speedChangeHere || !speedChangeable}
            isValid={speedValid}
          />
        </span>
        {props.currentSpeedIndex !== undefined &&
          props.currentLevel?.speedChanges[props.currentSpeedIndex] &&
          !speedChangeable && (
            <span className="ml-2 text-sm inline-block">
              Code タブで編集されているため変更できません。
            </span>
          )}
      </p>
      <p className="ml-2 mt-2">
        <span>Beat</span>

      </p>
    </>
  );
}
