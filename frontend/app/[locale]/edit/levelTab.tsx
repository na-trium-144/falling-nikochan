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
import { ChartEditing } from "./chartState";

interface Props {
  chart?: ChartEditing;
}
export default function LevelTab(props: Props) {
  const t = useTranslations("edit.level");
  const _addLevel = () => {
    if (props.chart) {
      props.changeChart({
        ...props.chart,
        levels: props.chart.levels.concat([emptyLevel(currentLevel)]),
      });
      props.setCurrentLevelIndex(props.chart.levels.length);
    }
  };
  const _duplicateLevel = () => {
    if (props.chart && currentLevel) {
      props.changeChart({
        ...props.chart,
        levels: props.chart.levels.concat([copyLevel(currentLevel)]),
      });
      props.setCurrentLevelIndex(props.chart.levels.length);
    }
  };
  const _deleteLevel = () => {
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

  const levelTypeDisabled = [
    props.chart?.currentLevel && props.chart?.currentLevel?.maxHitNum > 1,
    props.chart?.currentLevel && props.chart?.currentLevel?.maxHitNum > 2,
    false,
  ];

  return (
    <>
      <p>
        <span className="mr-1">{t("levelsList")}:</span>
        <Button
          text={t("levelAdd")}
          onClick={() =>
            props.chart?.addLevel(
              emptyLevel(props.chart?.currentLevel?.toObject())
            )
          }
        />
        {props.chart?.currentLevel && (
          <>
            <Button
              text={t("levelDuplicate")}
              onClick={() =>
                props.chart?.currentLevel &&
                props.chart?.addLevel(
                  copyLevel(props.chart?.currentLevel?.toObject())
                )
              }
            />
            <Button
              text={t("levelDelete")}
              onClick={() => {
                if (props.chart && window.confirm(t("deleteConfirm"))) {
                  props.chart.deleteLevel();
                }
              }}
              disabled={props.chart.levels.length <= 1}
            />
            <Button
              text="↑"
              onClick={props.chart?.moveLevelUp}
              disabled={props.chart?.currentLevelIndex === 0}
            />
            <Button
              text="↓"
              onClick={props.chart?.moveLevelDown}
              disabled={
                props.chart?.currentLevelIndex === props.chart.levels.length - 1
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
                i === props.chart?.currentLevelIndex
                  ? "text-blue-600 dark:text-blue-400"
                  : "hover:text-slate-500 hover:dark:text-stone-400",
                level.meta.unlisted && "text-slate-400 dark:text-stone-600"
              )}
              onClick={() => props.chart?.setCurrentLevelIndex(i)}
            >
              <span className="inline-block w-5 translate-y-0.5">
                {i === props.chart?.currentLevelIndex && (
                  <RightOne theme="filled" />
                )}
              </span>
              <span className="inline-block w-4 mr-2 text-right">{i + 1}.</span>
              {level.meta.name && (
                <span className="inline-block mr-2 font-title">
                  {level.meta.name}
                </span>
              )}
              {level.meta.unlisted && (
                <span className="text-sm mr-2">{t("unlisted")}</span>
              )}
              <span
                className={clsx(
                  "inline-block mr-2",
                  i === props.chart?.currentLevelIndex &&
                    levelColors[levelTypes.indexOf(level.meta.type)]
                )}
              >
                <span className="text-sm">{level.meta.type}-</span>
                <span className="text-lg">{level.difficulty}</span>
              </span>
              <span
                className={clsx(
                  "inline-block",
                  level.freeze.notes.length ||
                    "text-slate-400 dark:text-stone-600"
                )}
              >
                ({level.freeze.notes.length} notes)
              </span>
            </button>
          </li>
        ))}
      </ul>
      <hr className="mb-3 " />
      {props.chart?.currentLevel && (
        <>
          <p className="flex flex-row items-baseline mb-1">
            <span className="w-max">{t("levelName")}:</span>
            <Input
              className="font-title shrink"
              actualValue={props.chart.currentLevel.meta.name}
              updateValue={(n) => {
                props.chart?.currentLevel?.updateMeta({ name: n });
              }}
              left
            />
          </p>
          <p className="mb-2">
            <span>{t("difficulty")}:</span>
            {levelTypesConst.map((t, i) => (
              <CheckBox
                key={t}
                value={t === props.chart?.currentLevel?.meta.type}
                className={clsx(
                  "ml-2",
                  t === props.chart?.currentLevel?.meta.type && levelColors[i]
                )}
                onChange={() => {
                  props.chart?.currentLevel?.updateMeta({ type: t });
                }}
                disabled={levelTypeDisabled[i]}
              >
                {t}
              </CheckBox>
            ))}
          </p>
          <p>
            <CheckBox
              value={props.chart?.currentLevel?.meta.unlisted}
              className="ml-0"
              onChange={() => {
                props.chart?.currentLevel?.updateMeta({
                  unlisted: !props.chart.currentLevel.meta.unlisted,
                });
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
