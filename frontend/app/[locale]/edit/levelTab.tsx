import clsx from "clsx/lite";
import {
  emptyLevel,
  levelTypesConst,
  ChartEditing,
  Difficulty,
  difficulty,
} from "@falling-nikochan/chart";
import Button from "@/common/button.js";
import { HelpIcon } from "@/common/caption";
import CheckBox from "@/common/checkBox.js";
import Input from "@/common/input.js";
import RightOne from "@icon-park/react/lib/icons/RightOne";
import { useTranslations } from "next-intl";
import { Scrollable } from "@/common/scrollable";
import { useEffect, useState } from "react";

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

  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty | null>(
    null
  );
  useEffect(() => {
    if (currentLevel) {
      const updateDifficulty = () =>
        setCurrentDifficulty(
          difficulty(currentLevel.freeze, currentLevel.meta.type)
        );
      updateDifficulty();
      chart?.on("change", updateDifficulty);
      return () => {
        chart?.off("change", updateDifficulty);
      };
    }
  }, [chart, currentLevel]);

  return (
    <>
      <div>
        <span className="mr-1">{t("levelsList")}:</span>
        <Button
          text={t("levelAdd")}
          onClick={() =>
            chart?.addLevel(
              emptyLevel(
                currentLevel?.freeze.bpmChanges,
                currentLevel?.freeze.speedChanges,
                currentLevel?.freeze.signature
              )
            )
          }
        />
        {currentLevel && (
          <>
            <Button
              text={t("levelDuplicate")}
              onClick={() =>
                currentLevel &&
                chart?.addLevel({
                  min: currentLevel.meta,
                  lua: currentLevel.lua,
                  freeze: currentLevel.freeze,
                })
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
      </div>
      <Scrollable
        as="ul"
        className="ml-2 mt-2 mb-2 space-y-1 max-h-32"
        scrollableY
      >
        {chart?.levels.map((level, i) => (
          <li key={i}>
            <button
              className={clsx(
                i === chart?.currentLevelIndex &&
                  "text-blue-600 dark:text-blue-400",
                "hover:text-highlight cursor-pointer",
                level.meta.unlisted && "text-dim"
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
                  "fn-level-type",
                  i === chart?.currentLevelIndex && level.meta.type
                )}
              >
                <span>{level.meta.type}-</span>
                <span>{Math.round(level.difficulty.alv)}</span>
              </span>
              <span
                className={clsx(
                  "inline-block",
                  level.freeze.notes.length || "text-dim"
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
          <div className="flex flex-row items-baseline mb-1">
            <span className="w-max">{t("levelName")}:</span>
            <Input
              className="font-title shrink"
              actualValue={currentLevel.meta.name}
              updateValue={(n) => {
                currentLevel?.updateMeta({ name: n });
              }}
              left
            />
          </div>
          <div className="">
            <span>{t("levelType")}:</span>
            {levelTypesConst.map((t, i) => (
              <CheckBox
                id={`level-type-${t}`}
                key={t}
                value={t === currentLevel?.meta.type}
                className={clsx(
                  "ml-2",
                  t === currentLevel?.meta.type && `fn-level-col-${"sdm"[i]}`
                )}
                onChange={() => {
                  currentLevel?.updateMeta({ type: t });
                }}
                disabled={levelTypeDisabled[i]}
              >
                {t}
              </CheckBox>
            ))}
          </div>
          <div className="mb-2 ml-2 text-sm">
            <span>{t("difficulty")}:</span>
            <span className="text-base ml-2">
              {(currentDifficulty?.alv ?? 0).toString()}
            </span>
            {currentDifficulty && (
              <>
                <span className="ml-2">(</span>
                <span>{t("difficultyDetail.overall")}</span>
                <span className="ml-1">{currentDifficulty.clv.toString()}</span>
                <span className="mx-1">/</span>
                <span>{t("difficultyDetail.localMax")}</span>
                <span
                  className={clsx(
                    "ml-1",
                    currentDifficulty.plv >= currentDifficulty.clv + 4 &&
                      "fn-level-col-m"
                  )}
                >
                  {currentDifficulty.plv.toString()}
                  {currentDifficulty.plv >= currentDifficulty.clv + 4 && "+"}
                </span>
                {currentDifficulty.additionalHit > 0 && (
                  <>
                    <span className="mx-1">/</span>
                    <span>{t("difficultyDetail.multi")}</span>
                    <span className="fn-level-col-m">
                      +{currentDifficulty.additionalHit.toString()}
                    </span>
                  </>
                )}
                <span>)</span>
              </>
            )}
          </div>
          <div>
            <CheckBox
              id="level-unlisted"
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
          </div>
        </>
      )}
    </>
  );
}
