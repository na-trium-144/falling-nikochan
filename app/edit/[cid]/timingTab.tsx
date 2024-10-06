import Input from "@/common/input";
import {
  stepDenominator,
  stepFourth,
  stepMeasure,
  stepNumerator,
  stepStr,
} from "./str";
import { Step, stepCmp, stepZero } from "@/chartFormat/step";

interface Props {
  offset?: number;
  setOffset: (offset: number) => void;
  prevBpm?: number;
  prevSpeed?: number;
  currentBpm?: number;
  setCurrentBpm: (bpm: number) => void;
  bpmChangeHere: boolean;
  toggleBpmChangeHere: () => void;
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
          className="w-16 mx-1"
          actualValue={
            props.bpmChangeHere
              ? props.prevBpm?.toString() || ""
              : props.currentBpm !== undefined
              ? props.currentBpm.toString()
              : ""
          }
          updateValue={(v: string) => props.setCurrentBpm(Number(v))}
          disabled={props.bpmChangeHere}
          isValid={bpmValid}
        />
        <span>→</span>
        <input
          className="ml-4 mr-1"
          type="checkbox"
          id="bpmChangeHere"
          checked={props.bpmChangeHere}
          onChange={() => {
            // bpmの変更時にspeedも変える
            if (props.currentBpm == props.currentSpeed) {
              props.toggleSpeedChangeHere();
            }
            props.toggleBpmChangeHere();
          }}
          disabled={stepCmp(props.currentStep, stepZero()) <= 0}
        />
        <label htmlFor="bpmChangeHere">ここで変化</label>
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
          disabled={!props.bpmChangeHere}
          isValid={bpmValid}
        />
      </p>
      <p className="ml-2">
        <span>Speed</span>
        <Input
          className="w-16 mx-1"
          actualValue={
            props.speedChangeHere
              ? props.prevSpeed?.toString() || ""
              : props.currentSpeed !== undefined
              ? props.currentSpeed.toString()
              : ""
          }
          updateValue={(v: string) => props.setCurrentSpeed(Number(v))}
          disabled={props.speedChangeHere}
          isValid={speedValid}
        />
        <span>→</span>
        <input
          className="ml-4 mr-1"
          type="checkbox"
          id="speedChangeHere"
          checked={props.speedChangeHere}
          onChange={props.toggleSpeedChangeHere}
          disabled={stepCmp(props.currentStep, stepZero()) <= 0}
        />
        <label htmlFor="speedChangeHere">ここで変化</label>
        <Input
          className="w-16 mx-1"
          actualValue={props.currentSpeed?.toString() || ""}
          updateValue={(v: string) => props.setCurrentSpeed(Number(v))}
          disabled={!props.speedChangeHere}
          isValid={speedValid}
        />
      </p>
    </>
  );
}
