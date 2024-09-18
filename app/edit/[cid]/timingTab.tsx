import { Step, stepCmp, stepZero } from "@/chartFormat/command";
import Input from "@/common/input";
import { stepStr } from "./str";

interface Props {
  offset?: number;
  setOffset: (offset: number) => void;
  currentBpm?: number;
  setCurrentBpm: (bpm: number) => void;
  bpmChangeHere: boolean;
  toggleBpmChangeHere: () => void;
  currentStep: Step;
}
export default function TimingTab(props: Props) {
  const offsetValid = (offset: string) =>
    !isNaN(Number(offset)) && Number(offset) >= 0;
  const bpmValid = (bpm: string) => !isNaN(Number(bpm)) && Number(bpm) > 0;
  return (
    <>
      <p className="mb-1">
        <span>Offset</span>
        <Input
          actualValue={
            props.offset !== undefined ? props.offset.toString() : ""
          }
          updateValue={(v: string) => props.setOffset(Number(v))}
          isValid={offsetValid}
        />
        <span>s</span>
      </p>
      <p>
        <span>Current BPM:</span>
        <Input
          actualValue={
            props.currentBpm !== undefined ? props.currentBpm.toString() : ""
          }
          updateValue={(v: string) => props.setCurrentBpm(Number(v))}
          isValid={bpmValid}
        />
      </p>
      <p>
        <input
          className="ml-4 mr-1"
          type="checkbox"
          id="bpmChangeHere"
          checked={props.bpmChangeHere}
          onChange={props.toggleBpmChangeHere}
          disabled={stepCmp(props.currentStep, stepZero()) <= 0}
        />
        <label htmlFor="bpmChangeHere">
          <span>Change BPM Here (at {stepStr(props.currentStep)})</span>
        </label>
      </p>
    </>
  );
}
