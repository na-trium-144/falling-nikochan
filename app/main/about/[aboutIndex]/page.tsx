import { IndexMain } from "@/main/main";
import { useDisplayMode } from "@/scale";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import Link from "next/link";
import { AboutContent2 } from "./2-play";
import { AboutContent1 } from "./1-about";
import { AboutContent3 } from "./3-edit";
import { metaDataTitle } from "@/common/title";
import { Pager } from "@/common/pager";

const aboutTitles = ["", "概要", "遊び方", "譜面を作ろう"];

export function generateMetadata(context: { params: Params }) {
  const aboutIndex = Number(context.params.aboutIndex);
  return metaDataTitle(aboutTitles[aboutIndex]);
}

const maxIndex = 3;
export default function AboutTab(context: { params: Params }) {
  const aboutIndex = Number(context.params.aboutIndex);

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
        ) : (
          <p> Not Found</p>
        )}
      </div>
    </IndexMain>
  );
}
