"use client";

import clsx from "clsx/lite";
import { Box, modalBg } from "@/common/box.js";
import { Pager } from "@/common/pager.js";
import Button from "@/common/button.js";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

const maxIndex = 7;

interface Props {
  content: ReactNode;
  index: number;
  setIndex: (i: number) => void;
  close: () => void;
  locale: string;
}
export function GuideMain(props: Props) {
  const t = useTranslations("edit.guide");
  return (
    <div className={clsx(modalBg)}>
      <Box
        className="absolute inset-6 m-auto p-6 overflow-y-auto shadow-md flex flex-col"
        style={{ maxWidth: "40rem", maxHeight: "40rem" }}
      >
        <Pager
          index={props.index}
          maxIndex={maxIndex}
          title={t(`titles.${props.index}`)}
          onClickBefore={() => props.setIndex(props.index - 1)}
          onClickAfter={() => props.setIndex(props.index + 1)}
        />
        <ul className="list-inside list-disc-as-text flex-1 ">
          {props.content}
        </ul>
        <p className="w-max m-auto">
          <Button
            text={props.index === 1 ? t("agreeClose") : t("close")}
            onClick={props.close}
          />
        </p>
      </Box>
    </div>
  );
}
