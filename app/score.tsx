interface Props {
  className?: string;
  style?: object;
  score: number;
  best: number;
}
export default function ScoreDisp(props: Props) {
  const { score, best } = props;
  return (
    <div className={props.className + " bg-white flex flex-col"}>
      <div className="flex flex-row items-baseline">
        <span className="flex-1 text-md mr-2">Score</span>
        <div className="flex-none">
          <NumDisp num={score} fontSize1={48} fontSize2={24} />
        </div>
      </div>
      <div className="flex flex-row items-baseline">
        <span className="flex-1 text-md mr-2">Best Score</span>
        <div className="flex-none">
          <NumDisp num={best} fontSize1={24} fontSize2={24} />
        </div>
      </div>
    </div>
  );
}

interface NumProps {
  num: number;
  fontSize1: number;
  fontSize2: number;
}
function NumDisp(props: NumProps) {
  return (
    <>
      {[100, 10, 1].map((a) => (
        <span
          key={a}
          className="inline-block text-center"
          style={{
            width: (28 / 48) * props.fontSize1,
            fontSize: props.fontSize1,
            lineHeight: 1,
          }}
        >
          {(a == 1 || props.num >= a) && Math.floor(props.num / a) % 10}
        </span>
      ))}
      <span
        className="inline-block"
        style={{ fontSize: props.fontSize2, lineHeight: 1 }}
      >
        .
      </span>
      {[10, 100].map((a) => (
        <span
          key={a}
          className="inline-block text-center"
          style={{
            width: (28 / 48) * props.fontSize2,
            fontSize: props.fontSize2,
            lineHeight: 1,
          }}
        >
          {Math.floor(props.num * a) % 10}
        </span>
      ))}
    </>
  );
}
