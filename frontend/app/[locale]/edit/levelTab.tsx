import clsx from "clsx/lite";
import {
  emptyLevel,
  copyLevel,
  levelTypes,
  ChartEdit,
  levelTypesConst,
} from "@falling-nikochan/chart";
import { difficulty } from "@falling-nikochan/chart";
import { Step, stepCmp } from "@falling-nikochan/chart";
import Button from "@/common/button.js";
import { HelpIcon } from "@/common/caption";
import CheckBox from "@/common/checkBox.js";
import Input from "@/common/input.js";
import { levelColors } from "@/common/levelColors";
import RightOne from "@icon-park/react/lib/icons/RightOne";
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
        levels: props.chart.levels.concat([copyLevel(currentLevel)]),
      });
      props.setCurrentLevelIndex(props.chart.levels.length);
    }
  };
  const deleteLevel = () => {
    if (props.chart && window.confirm(t("deleteConfirm"))) {
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
        props.chart.levels.map((level) => difficulty(level, level.type))
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
            <Button
              text={t("levelDelete")}
              onClick={deleteLevel}
              disabled={props.chart.levels.length <= 1}
            />
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
        {props.chart?.levels.map((level, i) => (
          <li key={i}>
            <button
              className={clsx(
                i === props.currentLevelIndex
                  ? "text-blue-600 dark:text-blue-400"
                  : "hover:text-slate-500 hover:dark:text-stone-400",
                level.unlisted && "text-slate-400 dark:text-stone-600"
              )}
              onClick={() => props.setCurrentLevelIndex(i)}
            >
              <span className="inline-block w-5 translate-y-0.5">
                {i === props.currentLevelIndex && <RightOne theme="filled" />}
              </span>
              <span className="inline-block w-4 mr-2 text-right">{i + 1}.</span>
              {level.name && (
                <span className="inline-block mr-2 font-title">
                  {level.name}
                </span>
              )}
              {level.unlisted && (
                <span className="text-sm mr-2">{t("unlisted")}</span>
              )}
              <span
                className={clsx(
                  "inline-block mr-2",
                  i === props.currentLevelIndex &&
                    levelColors[levelTypes.indexOf(level.type)]
                )}
              >
                <span className="text-sm">{level.type}-</span>
                <span className="text-lg">{levelsDifficulty[i]}</span>
              </span>
              <span
                className={clsx(
                  "inline-block",
                  level.notes.length || "text-slate-400 dark:text-stone-600"
                )}
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
          <p className="flex flex-row items-baseline mb-1">
            <span className="w-max">{t("levelName")}:</span>
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
          <p className="mb-2">
            <span>{t("difficulty")}:</span>
            {levelTypesConst.map((t, i) => (
              <CheckBox
                key={t}
                value={t === currentLevel.type}
                className={clsx(
                  "ml-2",
                  t === currentLevel.type && levelColors[i]
                )}
                onChange={() => {
                  currentLevel.type = t;
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
              value={currentLevel.unlisted}
              className="ml-0"
              onChange={() => {
                currentLevel.unlisted = !currentLevel.unlisted;
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
