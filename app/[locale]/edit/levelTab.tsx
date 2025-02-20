import {
  emptyLevel,
  copyLevel,
  levelTypes,
  ChartEdit,
} from "@/../../chartFormat/chart.js";
import { difficulty } from "@/../../chartFormat/difficulty.js";
import { Step, stepCmp } from "@/../../chartFormat/step.js";
import Button from "@/common/button.js";
import { HelpIcon } from "@/common/caption";
import CheckBox from "@/common/checkBox.js";
import Input from "@/common/input.js";
import { levelColors } from "@/common/levelColors";
import { RightOne } from "@icon-park/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface Props {
  chart?: ChartEdit;
  currentLevelIndex: number;
  setCurrentLevelIndex: (i: number) => void;
  changeChart: (chart: ChartEdit) => void;
}
export default function LevelTab(props: Props) {
  const t = useTranslations("edit.level");
  const currentLevel = props.chart?.levelsFreezed.at(props.currentLevelIndex);
  const currentLevelMin = props.chart?.levels.at(props.currentLevelIndex);
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
    if (props.chart && currentLevelMin) {
      props.changeChart({
        ...props.chart,
        levels: props.chart.levels.concat([copyLevel(currentLevelMin)]),
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
  const moveLevelUp = () => {
    if (props.chart && props.currentLevelIndex > 0) {
      const levels = props.chart.levels.slice();
      const tmp = levels[props.currentLevelIndex];
      levels[props.currentLevelIndex] = levels[props.currentLevelIndex - 1];
      levels[props.currentLevelIndex - 1] = tmp;
      props.changeChart({ ...props.chart, levels });
      props.setCurrentLevelIndex(props.currentLevelIndex - 1);
    }
  };
  const moveLevelDown = () => {
    if (
      props.chart &&
      props.currentLevelIndex < props.chart.levels.length - 1
    ) {
      const levels = props.chart.levels.slice();
      const tmp = levels[props.currentLevelIndex];
      levels[props.currentLevelIndex] = levels[props.currentLevelIndex + 1];
      levels[props.currentLevelIndex + 1] = tmp;
      props.changeChart({ ...props.chart, levels });
      props.setCurrentLevelIndex(props.currentLevelIndex + 1);
    }
  };

  const [levelsDifficulty, setLevelsDifficulty] = useState<number[]>([]);
  useEffect(() => {
    if (props.chart) {
      setLevelsDifficulty(
        props.chart.levelsFreezed.map((level, i) =>
          difficulty(level, props.chart!.levels[i].type)
        )
      );
    }
  }, [props.chart]);
  const [maxHitNum, setMaxHitNum] = useState<number>(0);
  useEffect(() => {
    if (currentLevel) {
      let prevStep: Step = { fourth: -1, numerator: 0, denominator: 4 };
      let maxHitNum = 1;
      let hitNum = 0;
      for (let i = 0; i < currentLevel.notes.length; i++) {
        const n = currentLevel.notes[i];
        if (stepCmp(prevStep, n.step) < 0) {
          prevStep = n.step;
          hitNum = 1;
          continue;
        } else if (stepCmp(prevStep, n.step) == 0) {
          hitNum++;
          maxHitNum = Math.max(hitNum, maxHitNum);
        }
      }
      setMaxHitNum(maxHitNum);
    }
  }, [currentLevel]);
  const levelTypeDisabled = [maxHitNum > 1, maxHitNum > 2, false];

  return (
    <>
      <p>
        <span className="mr-1">{t("levelsList")}:</span>
        <Button text={t("levelAdd")} onClick={addLevel} />
        {props.chart?.levels.at(props.currentLevelIndex) && (
          <>
            <Button text={t("levelDuplicate")} onClick={duplicateLevel} />
            <Button text={t("levelDelete")} onClick={deleteLevel} />
            <Button
              text="↑"
              onClick={moveLevelUp}
              disabled={props.currentLevelIndex === 0}
            />
            <Button
              text="↓"
              onClick={moveLevelDown}
              disabled={
                props.currentLevelIndex === props.chart.levels.length - 1
              }
            />
          </>
        )}
      </p>
      <ul className="ml-2 mt-2 mb-2 space-y-1 max-h-32 overflow-y-auto">
        {props.chart?.levelsFreezed.map((level, i) => (
          <li key={i}>
            <button
              className={
                i === props.currentLevelIndex
                  ? "text-blue-600 dark:text-blue-400 "
                  : "hover:text-slate-500 hover:dark:text-stone-400 " +
                    (props.chart!.levels[i].unlisted
                      ? "text-slate-400 dark:text-stone-600 "
                      : "")
              }
              onClick={() => props.setCurrentLevelIndex(i)}
            >
              <span className="inline-block w-5 translate-y-0.5">
                {i === props.currentLevelIndex && <RightOne theme="filled" />}
              </span>
              <span className="inline-block w-4 mr-2 text-right">{i + 1}.</span>
              {props.chart!.levels[i].name && (
                <span className="inline-block mr-2 font-title">
                  {props.chart!.levels[i].name}
                </span>
              )}
              {props.chart!.levels[i].unlisted && (
                <span className="text-sm mr-2">{t("unlisted")}</span>
              )}
              <span
                className={
                  "inline-block mr-2 " +
                  (i === props.currentLevelIndex
                    ? levelColors[
                        levelTypes.indexOf(props.chart!.levels[i].type)
                      ]
                    : "")
                }
              >
                <span className="text-sm">{props.chart!.levels[i].type}-</span>
                <span className="text-lg">{levelsDifficulty[i]}</span>
              </span>
              <span
                className={
                  "inline-block " +
                  (level.notes.length
                    ? ""
                    : "text-slate-400 dark:text-stone-600 ")
                }
              >
                ({level.notes.length} notes)
              </span>
            </button>
          </li>
        ))}
      </ul>
      <hr className="mb-3 " />
      {currentLevel && currentLevelMin && (
        <>
          <p className="flex flex-row items-baseline mb-1">
            <span className="w-max">{t("levelName")}:</span>
            <Input
              className="font-title shrink"
              actualValue={currentLevelMin.name}
              updateValue={(n) => {
                currentLevelMin.name = n;
                props.changeChart({ ...props.chart! });
              }}
              left
            />
          </p>
          <p className="mb-2">
            <span>{t("difficulty")}:</span>
            {levelTypes.map((t, i) => (
              <CheckBox
                key={t}
                value={t === currentLevelMin.type}
                className={
                  "ml-2 " + (t === currentLevelMin.type ? levelColors[i] : "")
                }
                onChange={() => {
                  currentLevelMin.type = t;
                  props.changeChart({ ...props.chart! });
                }}
                disabled={levelTypeDisabled[i]}
              >
                {t}
              </CheckBox>
            ))}
          </p>
          <p>
            <CheckBox
              value={currentLevelMin.unlisted}
              className="ml-0"
              onChange={() => {
                currentLevelMin.unlisted = !currentLevelMin.unlisted;
                props.changeChart({ ...props.chart! });
              }}
            >
              {t("unlistLevel")}
            </CheckBox>
            <HelpIcon>{t.rich("unlistHelp", { br: () => <br /> })}</HelpIcon>
          </p>
        </>
      )}
    </>
  );
}
