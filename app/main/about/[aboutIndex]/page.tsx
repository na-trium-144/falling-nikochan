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
      <h3 className="text-xl font-bold font-title mb-4">
        {
          [
            "",
            "FallingNikochanの概要",
            "FallingNikochanのルール",
            "譜面を作ろう",
          ][aboutIndex]
        }
      </h3>
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
      <div className="flex flex-row items-baseline">
        <div className="flex-1 text-right">
          {aboutIndex > 1 && (
            <Link
              className="p-2 aspect-square rounded-full text-xl text-bold hover:bg-gray-200"
              href={`/main/about/${aboutIndex - 1}`}
              scroll={false}
              replace
            >
              &lt;
            </Link>
          )}
        </div>
        <span className="w-6 text-right">{aboutIndex}</span>
        <span className="mx-2">/</span>
        <span className="w-6 text-left">{maxIndex}</span>
        <div className="flex-1 text-left">
          {aboutIndex < maxIndex && (
            <Link
              className="p-2 aspect-square rounded-full text-xl text-bold hover:bg-gray-200"
              href={`/main/about/${aboutIndex + 1}`}
              scroll={false}
              replace
            >
              &gt;
            </Link>
          )}
        </div>
      </div>
    </IndexMain>
  );
}
