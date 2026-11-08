"use client";

import clsx from "clsx/lite";
import { Box } from "@/common/box.js";
import { Pager } from "@/common/pager.js";
import Button, { ButtonHighlight } from "@/common/button.js";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { InitNoteStyle, initNoteStyles } from "@falling-nikochan/chart";

const maxIndex = 7;

interface Props {
  content: ReactNode;
  index: number;
  setIndex: (i: number) => void;
  close: () => void;
  locale: string;

  initNoteStyle: InitNoteStyle;
  setInitNoteStyle: (i: InitNoteStyle) => void;
}
export function GuideMain(props: Props) {
  const t = useTranslations("edit.guide");
  return (
    <div className={clsx("fn-modal-bg")}>
      <Box
        classNameOuter="shadow-modal"
        classNameInner="flex flex-col"
        scrollableY
        padding={6}
        styleOuter={{
          width: "calc(100% - 3rem)",
          height: "calc(100% - 3rem)",
          maxWidth: "40rem",
          maxHeight: "40rem",
        }}
      >
        <Pager
          index={props.index}
          maxIndex={maxIndex}
          title={t(`titles.${props.index}`)}
          onClickBefore={() => props.setIndex(props.index - 1)}
          onClickAfter={() => props.setIndex(props.index + 1)}
        />
        {/* scrollableのフェードを更新するため、意図的にkeyを追加しこのdivごと変化させる */}
        <div key={props.index} className="flex-1">
          {props.content}
          {props.index === 1 && (
            <>
              <hr className="fn-hr" />
              <h4 className="fn-heading-box">{t("initNoteStyle")}</h4>
              <div className="flex justify-center">
                {initNoteStyles.map((s) => (
                  <button
                    key={s}
                    className={clsx(
                      "fn-toggle",
                      s === props.initNoteStyle
                        ? "fn-flat-button fn-plain fn-selected"
                        : "fn-flat-button fn-sky"
                    )}
                    onClick={() => props.setInitNoteStyle(s)}
                  >
                    <span className="fn-glass-1" />
                    <span className="fn-glass-2" />
                    <ButtonHighlight />
                    {t(s)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <p className="w-max m-auto">
          <Button
            text={/*props.index === 1 ? t("agreeClose") : */ t("close")}
            onClick={props.close}
          />
        </p>
      </Box>
    </div>
  );
}
