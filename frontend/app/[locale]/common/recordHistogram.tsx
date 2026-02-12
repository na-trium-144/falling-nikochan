import clsx from "clsx/lite";
interface Props {
  histogram: number[];
  bestScoreTotal: number | null;
}
export function RecordHistogram(props: Props) {
  const histogramMax = Math.max(
    10,
    props.histogram.reduce((max, h) => Math.max(max, h), 0) || 0
  );

  return (
    <div className="inline-flex flex-row w-max max-w-full text-xs/3 text-left isolate">
      {props.histogram.map((h, i) => (
        <div key={i} className="w-5 min-w-0 shrink relative">
          {[7, 10, 12].includes(i) && (
            <div
              className={clsx(
                "absolute inset-0 -z-10",
                "border-l border-slate-500/20 dark:border-stone-400/20"
              )}
            />
          )}
          <div className="h-8 relative border-b border-slate-500/20 dark:border-stone-400/20 ">
            <HistorgramColumn
              value={h}
              i={i}
              histogramMax={histogramMax}
              bestScoreTotal={props.bestScoreTotal}
            />
          </div>
          {[0, 7, 10, 12].includes(i) && (
            <div className="ml-[0.1em]">{i * 10}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function HistorgramColumn(props: {
  value: number;
  i: number;
  histogramMax: number;
  bestScoreTotal: number | null;
}) {
  const hasBestScore =
    props.bestScoreTotal !== null &&
    props.bestScoreTotal >= props.i * 10 &&
    props.bestScoreTotal < (props.i + 1) * 10;
  const value = Math.max(props.value, hasBestScore ? 1 : 0);
  if (value === 0) {
    return null;
  }
  return (
    <div
      className={clsx(
        "absolute inset-x-0 bottom-0 min-h-[1px]",
        hasBestScore
          ? "bg-orange-300 dark:bg-sky-800"
          : "bg-slate-500 dark:bg-stone-400"
      )}
      style={{
        height: (value / props.histogramMax) * 100 + "%",
      }}
    />
  );
}
