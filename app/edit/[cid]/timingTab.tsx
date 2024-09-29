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
  prevScale?: number;
  currentBpm?: number;
  setCurrentBpm: (bpm: number) => void;
  bpmChangeHere: boolean;
  toggleBpmChangeHere: () => void;
  currentScale?: number;
  setCurrentScale: (bpm: number) => void;
  scaleChangeHere: boolean;
  toggleScaleChangeHere: () => void;
  currentStep: Step;
}
export default function TimingTab(props: Props) {
  const offsetValid = (offset: string) =>
    !isNaN(Number(offset)) && Number(offset) >= 0;
  const bpmValid = (bpm: string) => !isNaN(Number(bpm)) && Number(bpm) > 0;
  const scaleValid = (bpm: string) => !isNaN(Number(bpm));
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
            // bpmの変更時にscaleも変える
            if (props.currentBpm == props.currentScale) {
              props.toggleScaleChangeHere();
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
            // bpmの変更時にscaleも変える
            if (
              props.scaleChangeHere &&
              props.currentBpm === props.currentScale
            ) {
              props.setCurrentScale(Number(v));
            }
            props.setCurrentBpm(Number(v));
          }}
          disabled={!props.bpmChangeHere}
          isValid={bpmValid}
        />
      </p>
      <p className="ml-2">
        <span>Scale</span>
        <Input
          className="w-16 mx-1"
          actualValue={
            props.scaleChangeHere
              ? props.prevScale?.toString() || ""
              : props.currentScale !== undefined
              ? props.currentScale.toString()
              : ""
          }
          updateValue={(v: string) => props.setCurrentScale(Number(v))}
          disabled={props.scaleChangeHere}
          isValid={scaleValid}
        />
        <span>→</span>
        <input
          className="ml-4 mr-1"
          type="checkbox"
          id="scaleChangeHere"
          checked={props.scaleChangeHere}
          onChange={props.toggleScaleChangeHere}
          disabled={stepCmp(props.currentStep, stepZero()) <= 0}
        />
        <label htmlFor="scaleChangeHere">ここで変化</label>
        <Input
          className="w-16 mx-1"
          actualValue={props.currentScale?.toString() || ""}
          updateValue={(v: string) => props.setCurrentScale(Number(v))}
          disabled={!props.scaleChangeHere}
          isValid={scaleValid}
        />
      </p>
    </>
  );
}
