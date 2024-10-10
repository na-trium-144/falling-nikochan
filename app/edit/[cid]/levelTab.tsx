import {
  Chart,
  emptyLevel,
  levelColors,
  levelTypes,
} from "@/chartFormat/chart";
import Button from "@/common/button";
import Input from "@/common/input";
import { CheckCorrect, RightOne, Square } from "@icon-park/react";

interface Props {
  chart?: Chart;
  currentLevelIndex: number;
  setCurrentLevelIndex: (i: number) => void;
  changeChart: (chart: Chart) => void;
}
export default function LevelTab(props: Props) {
  const currentLevel = props.chart?.levels.at(props.currentLevelIndex);
  const addLevel = () => {
    if (props.chart) {
      props.changeChart({
        ...props.chart,
        levels: props.chart.levels.concat([emptyLevel(currentLevel)]),
      });
      props.setCurrentLevelIndex(props.chart.levels.length);
    }
  };
  const duplicateLevel = () => {
    if (props.chart && currentLevel) {
      props.changeChart({
        ...props.chart,
        levels: props.chart.levels.concat([
          {
            name: currentLevel.name,
            type: currentLevel.type,
            notes: currentLevel.notes.slice(),
            rest: currentLevel.rest.slice(),
            bpmChanges: currentLevel.bpmChanges.slice(),
            speedChanges: currentLevel.speedChanges.slice(),
            lua: currentLevel.lua.slice(),
          },
        ]),
      });
      props.setCurrentLevelIndex(props.chart.levels.length);
    }
  };
  const deleteLevel = () => {
    if (props.chart) {
      props.changeChart({
        ...props.chart,
        levels: props.chart.levels.filter(
          (_, i) => i !== props.currentLevelIndex
        ),
      });
      props.setCurrentLevelIndex(0);
    }
  };
  return (
    <>
      <p>
        <span className="mr-1">Levels:</span>
        <Button text={`Add`} onClick={addLevel} />
        {props.chart?.levels.at(props.currentLevelIndex) && (
          <>
            <Button text={`Duplicate`} onClick={duplicateLevel} />
            <Button text="Delete" onClick={deleteLevel} />
          </>
        )}
      </p>
      <ul className="ml-2 mt-2 mb-2 space-y-1 max-h-32 overflow-y-auto">
        {props.chart?.levels.map((level, i) => (
          <li key={i}>
            <button
              className={
                i === props.currentLevelIndex
                  ? "text-blue-600 "
                  : "hover:text-slate-500 "
              }
              onClick={() => props.setCurrentLevelIndex(i)}
            >
              <span className="inline-block w-5 translate-y-0.5">
                {i === props.currentLevelIndex && <RightOne theme="filled" />}
              </span>
              <span className="inline-block w-4 mr-2 text-right">{i + 1}.</span>
              <span className="inline-block mr-2 font-title">{level.name}</span>
              <span
                className={
                  "inline-block mr-2 " +
                  levelColors[levelTypes.indexOf(level.type)]
                }
              >
                {level.type}
              </span>
              <span
                className={
                  "inline-block " +
                  (level.notes.length ? "text-black " : "text-slate-300 ")
                }
              >
                ({level.notes.length} notes)
              </span>
            </button>
          </li>
        ))}
      </ul>
      <hr className="mb-3 " />
      {currentLevel && (
        <>
          <p className="flex flex-row items-baseline">
            <span className="w-max">Level Name:</span>
            <Input
              className="font-title shrink"
              actualValue={currentLevel.name}
              updateValue={(n) => {
                currentLevel.name = n;
                props.changeChart({ ...props.chart! });
              }}
              left
            />
          </p>
          <p>Difficulty:</p>
          <ul className="ml-2 ">
            {levelTypes.map((t, i) => (
              <li key={t}>
                <button
                  className={
                    (t === currentLevel.type ? levelColors[i] : "") +
                    "hover:text-slate-500 "
                  }
                  onClick={() => {
                    currentLevel.type = t;
                    props.changeChart({ ...props.chart! });
                  }}
                >
                  <span className="inline-block w-5 translate-y-0.5">
                    {t === currentLevel.type ? <CheckCorrect /> : <Square />}
                  </span>
                  <span>{t}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
