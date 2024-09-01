import Input from "./input";

interface Props {
  offset?: number;
  setOffset: (offset: number) => void;
  currentBpm?: number;
  setCurrentBpm: (bpm: number) => void;
  bpmChangeHere: boolean;
  toggleBpmChangeHere: () => void;
}
export default function TimingTab(props: Props) {
  const offsetValid = (offset: string) =>
    !isNaN(Number(offset)) && Number(offset) >= 0;
  const bpmValid = (bpm: string) => !isNaN(Number(bpm)) && Number(bpm) >= 0;
  return (
    <>
      <p>
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
      {/*<p>
        <input
          className="ml-4 mr-1"
          type="checkbox"
          id="bpmChangeHere"
          checked={props.bpmChangeHere}
          onChange={props.toggleBpmChangeHere}
        />
        <label htmlFor="bpmChangeHere">
          <span>Change At</span>
          <span className="ml-2">{Math.round(props.currentStep)}</span>
        </label>
        <span className="ml-1">:</span>
        <Input
          actualValue={chart ? chart.bpmChanges[0].bpm.toString() : ""}
          updateValue={changeBpm}
          isValid={bpmValid}
        />
      </p>*/}
    </>
  );
}
