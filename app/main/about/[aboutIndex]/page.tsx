import { IndexMain } from "@/main/main";
import { useDisplayMode } from "@/scale";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import Link from "next/link";
import { AboutContent2 } from "./2-play";
import { AboutContent1 } from "./1-about";
import { AboutContent3 } from "./3-edit";

const maxIndex = 3;
export default function AboutTab(context: { params: Params }) {
  const aboutIndex = Number(context.params.aboutIndex);

  return (
    <IndexMain tab={0}>
      <div className="flex flex-row items-center mb-4">
        {aboutIndex > 1 ? (
          <Link
            className={
              "px-2 text-center inline-block w-7 rounded-full " +
              "text-lg text-bold hover:bg-gray-200 active:bg-gray-300 "
            }
            href={`/main/about/${aboutIndex - 1}`}
            scroll={false}
            replace
          >
            &lt;
          </Link>
        ) : (
          <span className="inline-block w-7" />
        )}
        <div className="flex-1">
          <span className="inline-block">
            <span className="inline-block w-6 text-right">{aboutIndex}</span>
            <span className="mx-2">/</span>
            <span className="inline-block w-6 text-left">{maxIndex}</span>
          </span>
          <span className="inline-block text-xl font-bold font-title ">
            {
              [
                "",
                "概要",
                "遊び方",
                "譜面を作ろう",
              ][aboutIndex]
            }
          </span>
        </div>
        {aboutIndex < maxIndex ? (
          <Link
            className={
              "px-2 text-center inline-block w-7 rounded-full " +
              "text-lg text-bold hover:bg-gray-200 active:bg-gray-300 "
            }
            href={`/main/about/${aboutIndex + 1}`}
            scroll={false}
            replace
          >
            &gt;
          </Link>
        ) : (
          <span className="inline-block w-7" />
        )}
      </div>
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
