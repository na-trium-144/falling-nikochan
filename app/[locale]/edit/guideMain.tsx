"use client";

import { Box } from "@/common/box.js";
import { Pager } from "@/common/pager.js";
import GuideContent1Ja from "@/../i18n/ja/guide/1-welcome.mdx";
import GuideContent2Ja from "@/../i18n/ja/guide/2-metaTab.mdx";
import GuideContent3Ja from "@/../i18n/ja/guide/3-timeBar.mdx";
import GuideContent4Ja from "@/../i18n/ja/guide/4-timingTab.mdx";
import GuideContent5Ja from "@/../i18n/ja/guide/5-levelTab.mdx";
import GuideContent6Ja from "@/../i18n/ja/guide/6-noteTab.mdx";
import GuideContent7Ja from "@/../i18n/ja/guide/7-codeTab.mdx";
import GuideContent1En from "@/../i18n/en/guide/1-welcome.mdx";
import GuideContent2En from "@/../i18n/en/guide/2-metaTab.mdx";
import GuideContent3En from "@/../i18n/en/guide/3-timeBar.mdx";
import GuideContent4En from "@/../i18n/en/guide/4-timingTab.mdx";
import GuideContent5En from "@/../i18n/en/guide/5-levelTab.mdx";
import GuideContent6En from "@/../i18n/en/guide/6-noteTab.mdx";
import GuideContent7En from "@/../i18n/en/guide/7-codeTab.mdx";
import Button from "@/common/button.js";
import { useTranslations } from "next-intl";

const maxIndex = 7;

interface Props {
  index: number;
  setIndex: (i: number) => void;
  close: () => void;
  locale: string;
}
export function GuideMain(props: Props) {
  const t = useTranslations("edit.guide");
  return (
    <Box
      className="fixed inset-6 m-auto p-6 overflow-y-auto flex flex-col"
      style={{ maxWidth: "40rem", maxHeight: "40rem" }}
    >
      <Pager
        index={props.index}
        maxIndex={maxIndex}
        title={t(`titles.${props.index}`)}
        onClickBefore={() => props.setIndex(props.index - 1)}
        onClickAfter={() => props.setIndex(props.index + 1)}
      />
      <ul className="list-inside list-disc flex-1 ">
        {props.locale === "ja" ? (
          props.index === 1 ? (
            <GuideContent1Ja />
          ) : props.index === 2 ? (
            <GuideContent2Ja />
          ) : props.index === 3 ? (
            <GuideContent3Ja />
          ) : props.index === 4 ? (
            <GuideContent4Ja />
          ) : props.index === 5 ? (
            <GuideContent5Ja />
          ) : props.index === 6 ? (
            <GuideContent6Ja />
          ) : props.index === 7 ? (
            <GuideContent7Ja />
          ) : null
        ) : props.locale === "en" ? (
          props.index === 1 ? (
            <GuideContent1En />
          ) : props.index === 2 ? (
            <GuideContent2En />
          ) : props.index === 3 ? (
            <GuideContent3En />
          ) : props.index === 4 ? (
            <GuideContent4En />
          ) : props.index === 5 ? (
            <GuideContent5En />
          ) : props.index === 6 ? (
            <GuideContent6En />
          ) : props.index === 7 ? (
            <GuideContent7En />
          ) : null
        ) : (
          (console.error("unsupported locale"), null)
        )}
      </ul>
      <p className="w-max m-auto">
        <Button text={t("close")} onClick={props.close} />
      </p>
    </Box>
  );
}
