import { IndexMain } from "@/main/main.js";
import { AboutContent2 } from "./2-play.js";
import { AboutContent1 } from "./1-about.js";
import { AboutContent3 } from "./3-edit.js";
import { metaDataTitle } from "@/common/title.js";
import { Pager } from "@/common/pager.js";
import { AboutContent4 } from "./4-level.js";
import { AboutContent5 } from "./5-judge.js";
import { Params } from "next/dist/server/request/params";

const aboutTitles = [
  "",
  "概要",
  "遊び方",
  "譜面を作ろう",
  "難易度について",
  "ゲームの仕様",
];
const maxIndex = 5;

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return Array.from(new Array(maxIndex)).map((_, i) => ({ aboutIndex: (i + 1).toString() }));
}

export async function generateMetadata(context: { params: Promise<Params> }) {
  const aboutIndex = Number((await context.params).aboutIndex);
  return metaDataTitle(aboutTitles[aboutIndex]);
}

export default async function AboutTab(context: { params: Promise<Params> }) {
  const aboutIndex = Number((await context.params).aboutIndex);

  return (
    <IndexMain tab={0}>
      <Pager
        index={aboutIndex}
        maxIndex={maxIndex}
        hrefBefore={`/main/about/${aboutIndex - 1}`}
        hrefAfter={`/main/about/${aboutIndex + 1}`}
        title={aboutTitles[aboutIndex]}
      />
      <div className="flex-1 text-center break-keep break-words">
        {aboutIndex === 1 ? (
          <AboutContent1 />
        ) : aboutIndex === 2 ? (
          <AboutContent2 />
        ) : aboutIndex === 3 ? (
          <AboutContent3 />
        ) : aboutIndex === 4 ? (
          <AboutContent4 />
        ) : aboutIndex === 5 ? (
          <AboutContent5 />
        ) : (
          <p> Not Found</p>
        )}
      </div>
    </IndexMain>
  );
}
