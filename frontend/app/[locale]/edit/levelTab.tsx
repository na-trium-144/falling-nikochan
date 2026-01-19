import clsx from "clsx/lite";
import {
  emptyLevel,
  copyLevel,
  levelTypes,
  levelTypesConst,
  ChartEditing,
} from "@falling-nikochan/chart";
import Button from "@/common/button.js";
import { HelpIcon } from "@/common/caption";
import CheckBox from "@/common/checkBox.js";
import Input from "@/common/input.js";
import { levelColors } from "@/common/levelColors";
import RightOne from "@icon-park/react/lib/icons/RightOne";
import { useTranslations } from "next-intl";
import { Scrollable } from "@/common/scrollable";

interface Props {
  chart?: ChartEditing;
}
export default function LevelTab(props: Props) {
  const t = useTranslations("edit.level");
  const { chart } = props;
  const currentLevel = chart?.currentLevel;

  const levelTypeDisabled = [
    currentLevel && currentLevel?.maxHitNum > 1,
    currentLevel && currentLevel?.maxHitNum > 2,
    false,
  ];

  return (
    <>
      <p>
        <span className="mr-1">{t("levelsList")}:</span>
        <Button
          text={t("levelAdd")}
          onClick={() => chart?.addLevel(emptyLevel(currentLevel?.toObject()))}
        />
        {currentLevel && (
          <>
            <Button
              text={t("levelDuplicate")}
              onClick={() =>
                currentLevel &&
                chart?.addLevel(copyLevel(currentLevel?.toObject()))
              }
            />
            <Button
              text={t("levelDelete")}
              onClick={() => {
                if (chart && window.confirm(t("deleteConfirm"))) {
                  chart.deleteLevel();
                }
              }}
              disabled={chart.levels.length <= 1}
            />
            <Button
              text="↑"
              onClick={chart?.moveLevelUp}
              disabled={chart?.currentLevelIndex === 0}
            />
            <Button
              text="↓"
              onClick={chart?.moveLevelDown}
              disabled={chart.currentLevelIndex === chart.levels.length - 1}
            />
          </>
        )}
      </p>
      <Scrollable as="ul" className="ml-2 mt-2 mb-2 space-y-1 max-h-32">
        {chart?.levels.map((level, i) => (
          <li key={i}>
            <button
              className={clsx(
                i === chart?.currentLevelIndex
                  ? "text-blue-600 dark:text-blue-400"
                  : "hover:text-slate-500 hover:dark:text-stone-400",
                level.meta.unlisted && "text-slate-400 dark:text-stone-600"
              )}
              onClick={() => chart?.setCurrentLevelIndex(i)}
            >
              <span className="inline-block w-5 translate-y-0.5">
                {i === chart?.currentLevelIndex && <RightOne theme="filled" />}
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
                  i === chart?.currentLevelIndex &&
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
      </Scrollable>
      <hr className="mb-3 " />
      {currentLevel && (
        <>
          <p className="flex flex-row items-baseline mb-1">
            <span className="w-max">{t("levelName")}:</span>
            <Input
              className="font-title shrink"
              actualValue={currentLevel.meta.name}
              updateValue={(n) => {
                currentLevel?.updateMeta({ name: n });
              }}
              left
            />
          </p>
          <p className="mb-2">
            <span>{t("difficulty")}:</span>
            {levelTypesConst.map((t, i) => (
              <CheckBox
                key={t}
                value={t === currentLevel?.meta.type}
                className={clsx(
                  "ml-2",
                  t === currentLevel?.meta.type && levelColors[i]
                )}
                onChange={() => {
                  currentLevel?.updateMeta({ type: t });
                }}
                disabled={levelTypeDisabled[i]}
              >
                {t}
              </CheckBox>
            ))}
          </p>
          <p>
            <CheckBox
              value={currentLevel?.meta.unlisted}
              className="ml-0"
              onChange={() => {
                currentLevel?.updateMeta({
                  unlisted: !currentLevel.meta.unlisted,
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
