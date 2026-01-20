import { Box, modalBg } from "./box";
import { useTranslations } from "next-intl";
import clsx from "clsx/lite";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";
import { Pager, pagerButtonClass } from "./pager";
import {
  AboutContent,
  maxAboutPageIndex,
} from "@/main/about/[aboutIndex]/aboutContents";

interface AProps {
  aboutAnim: boolean;
  aboutPageIndex: number;
  setAboutPageIndex: (i: number | null) => void;
  locale: string;
}
export function AboutModal(props: AProps) {
  const tm = useTranslations("main.about");
  const t = useTranslations(`about.${props.aboutPageIndex}`);

  const close = () => props.setAboutPageIndex(null);
  return (
    <div
      className={clsx(
        modalBg,
        "transition-opacity duration-200",
        props.aboutAnim ? "ease-in opacity-100" : "ease-out opacity-0"
      )}
      onClick={close}
    >
      <div className="absolute inset-12 grid place-content-center place-items-center grid-rows-1 grid-cols-1">
        <Box
          classNameOuter={clsx(
            "w-180 h-max max-w-full max-h-full",
            "shadow-modal",
            "transition-transform duration-200 origin-center",
            props.aboutAnim ? "ease-in scale-100" : "ease-out scale-0"
          )}
          scrollableY
          padding={6}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-3 relative px-10 text-xl font-bold font-title">
            <button
              className={clsx(pagerButtonClass, "absolute left-0 inset-y-0")}
              onClick={close}
            >
              <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
            </button>
            {tm("title")}
          </h3>
          <Pager
            index={props.aboutPageIndex}
            maxIndex={maxAboutPageIndex}
            onClickBefore={() =>
              props.setAboutPageIndex(props.aboutPageIndex - 1)
            }
            onClickAfter={() =>
              props.setAboutPageIndex(props.aboutPageIndex + 1)
            }
            title={t("title")}
          />
          <div
            className="flex-1 flex flex-row "
            style={{ width: (maxAboutPageIndex + 1) * 100 + "%" }}
          >
            {Array.from(new Array(maxAboutPageIndex + 1)).map((_, i) => (
              // 選択中のページ以外を非表示にするが、
              // 非表示のページも含めてコンテンツの高さが最も高いものに合わせたサイズで表示させたいので、
              // 全部横に並べて非表示のページをtranslateXで画面外に送る
              <div
                key={i}
                className="basis-0 flex-1 relative h-max text-center"
                style={{
                  transform:
                    i === props.aboutPageIndex
                      ? `translateX(-${i * 100}%)`
                      : `translateX(100vw)`,
                }}
              >
                <AboutContent index={i} locale={props.locale} />
              </div>
            ))}
          </div>
        </Box>
      </div>
    </div>
  );
}
