import { Key } from "./messageBox";

interface Props {
  className?: string;
  judgeCount: number[];
  notesTotal: number;
}
export default function StatusBox(props: Props) {
  return (
    <div
      className={props.className + " p-3 w-52 rounded-lg text-sm z-10"}
      style={{ background: "rgba(255, 255, 255, 0.5)" }}
    >
      {[
        ["Space", "start"],
        ["Esc", "stop"],
      ].map(([keyName, act], i) => (
        <p key={i} className="mb-2 flex flex-row items-baseline">
          <span className="basis-7/12 inline-block text-center">
            <Key className="p-0.5 m-auto">{keyName}</Key>
          </span>
          <span className="">=</span>
          <span className="basis-6/12 text-center">{act}</span>
        </p>
      ))}
      {["Good", "OK", "Bad", "Miss"].map((name, ji) => (
        <p key={ji} className="flex flex-row items-baseline mr-12">
          <span className="flex-1">{name}</span>
          <span className="text-2xl text-right">{props.judgeCount[ji]}</span>
        </p>
      ))}
      <p className="flex flex-row items-baseline">
        <span className="flex-1">Remains</span>
        <span className="text-2xl text-right">
          {props.notesTotal - props.judgeCount.reduce((sum, j) => sum + j, 0)}
        </span>
        <span className="w-12 pl-1 flex flex-row items-baseline">
          <span className="flex-1">/</span>
          <span>{props.notesTotal}</span>
        </span>
      </p>
    </div>
  );
}
