"use client";

import { Box } from "@/common/box";
import { Pager } from "@/common/pager";
import { GuideContent1 } from "./1-welcome";
import { GuideContent2 } from "./2-meta";
import { GuideContent3 } from "./3-timeBar";
import { GuideContent4 } from "./4-timingTab";
import { GuideContent5 } from "./5-levelsTab";
import { GuideContent6 } from "./6-noteTab";
import { GuideContent7 } from "./7-codeTab";
import Button from "@/common/button";

const guideTitles = [
  "",
  "譜面編集 ヘルプ",
  "Meta タブ",
  "タイムバー",
  "Timing タブ",
  "Levels タブ",
  "Notes タブ",
  "Code タブ",
];
const maxIndex = 7;

interface Props {
  index: number;
  setIndex: (i: number) => void;
  close: () => void;
}
export function GuideMain(props: Props) {
  return (
    <Box
      className="fixed inset-6 m-auto p-6 overflow-y-auto flex flex-col"
      style={{ maxWidth: "40rem", maxHeight: "40rem" }}
    >
      <Pager
        index={props.index}
        maxIndex={maxIndex}
        title={guideTitles[props.index]}
        onClickBefore={() => props.setIndex(props.index - 1)}
        onClickAfter={() => props.setIndex(props.index + 1)}
      />
      <ul className="list-inside list-disc flex-1 ">
        {props.index === 1 ? (
          <GuideContent1 />
        ) : props.index === 2 ? (
          <GuideContent2 />
        ) : props.index === 3 ? (
          <GuideContent3 />
        ) : props.index === 4 ? (
          <GuideContent4 />
        ) : props.index === 5 ? (
          <GuideContent5 />
        ) : props.index === 6 ? (
          <GuideContent6 />
        ) : props.index === 7 ? (
          <GuideContent7 />
        ) : null}
      </ul>
      <p className="w-max m-auto">
        <Button text="閉じる" onClick={props.close} />
      </p>
    </Box>
  );
}