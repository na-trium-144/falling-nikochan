"use client";

import { Box } from "@/common/box";
import { Pager } from "@/common/pager";
import { GuideContent1 } from "./1-welcome";
import { GuideContent2 } from "./2-meta";
import { GuideContent3 } from "./3-timeBar";

const guideTitles = ["", "譜面編集 ヘルプ", "Meta タブ", "タイムバー"];
const maxIndex = 3;

interface Props {
  index: number;
  setIndex: (i: number) => void;
  close: () => void;
}
export function GuideMain(props: Props) {
  return (
    <Box
      className="fixed inset-6 m-auto p-6 overflow-y-auto "
      style={{ maxWidth: "40rem", maxHeight: "40rem" }}
    >
      <Pager
        index={props.index}
        maxIndex={maxIndex}
        title={guideTitles[props.index]}
        onClickBefore={() => props.setIndex(props.index - 1)}
        onClickAfter={() => props.setIndex(props.index + 1)}
      />
      <ul className="list-inside list-disc">
        {props.index === 1 ? (
          <GuideContent1 />
        ) : props.index === 2 ? (
          <GuideContent2 />
        ) : props.index === 3 ? (
          <GuideContent3 />
        ) : null}
      </ul>
    </Box>
  );
}
