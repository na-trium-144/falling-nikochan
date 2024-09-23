import { Box } from "@/common/box";
import { Key } from "@/common/key";

interface Props {
  className?: string;
  judgeCount: number[];
  notesTotal: number;
  isMobile: boolean;
  isTouch: boolean;
}
export default function StatusBox(props: Props) {
  return (
    <Box
      className={
        props.className +
        (props.isMobile ? " " : " w-52 ") +
        "p-3 text-sm z-10"
      }
    >
      {props.isTouch ? (
        <p className="mb-2 text-center">
          Tap the video to start/stop the game.
        </p>
      ) : (
        [
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
        ))
      )}
      <div className={props.isMobile ? "flex flex-row items-start" : ""}>
        {["Good", "OK", "Bad", "Miss"].map((name, ji) => (
          <p
            key={ji}
            className={
              props.isMobile
                ? "flex-1 flex flex-col mr-4 "
                : "flex flex-row items-baseline mr-12"
            }
          >
            <span className={props.isMobile ? "h-3 " : "flex-1"}>{name}</span>
            <span className="text-2xl text-right">{props.judgeCount[ji]}</span>
          </p>
        ))}
        <p
          className={
            props.isMobile
              ? "flex-1 flex flex-col "
              : "flex flex-row items-baseline "
          }
        >
          <span className={props.isMobile ? "h-3 " : "flex-1"}>Remains</span>
          <span className="text-2xl text-right">
            {props.notesTotal - props.judgeCount.reduce((sum, j) => sum + j, 0)}
          </span>
          {!props.isMobile && (
            <span className="w-12 pl-1 flex flex-row items-baseline">
              <span className="flex-1">/</span>
              <span>{props.notesTotal}</span>
            </span>
          )}{" "}
        </p>
        {props.isMobile && (
          <span className="w-12 pl-1 self-end flex flex-row items-baseline">
            <span className="flex-1">/</span>
            <span>{props.notesTotal}</span>
          </span>
        )}
      </div>
    </Box>
  );
}
