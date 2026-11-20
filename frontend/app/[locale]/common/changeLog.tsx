"use client";

import clsx from "clsx/lite";
import { useEffect } from "react";
import { Box } from "./box";
import Link from "next/link";
import { useTranslations } from "@/intlProvider";
import ArrowRight from "@icon-park/react/lib/icons/ArrowRight";
import { useDelayedDisplayState } from "./delayedDisplayState";
import { UpdateLastVisited } from "./version";
import { useParams } from "next/navigation";
import ChangeLogJa from "@falling-nikochan/i18n/ja/changelog.mdx";
import ChangeLogEn from "@falling-nikochan/i18n/en/changelog.mdx";

function ChangeLog() {
  const { locale } = useParams<{ locale: string }>();
  switch (locale) {
    case "ja":
      return <ChangeLogJa />;
    case "en":
      return <ChangeLogEn />;
    default:
      throw new Error(`Unknown locale ${locale}`);
  }
}

interface PopupProps {
  locale: string;
  open: boolean;
  onClose: () => void;
}
export function ChangeLogPopup(props: PopupProps) {
  const t = useTranslations("main.version");
  const [popupOpened, popupAppearing, setPopupOpened] =
    useDelayedDisplayState(200);
  useEffect(() => {
    setPopupOpened(props.open);
  }, [props.open, setPopupOpened]);
  return (
    popupOpened && (
      <>
        <UpdateLastVisited />
        <div
          className={clsx("fixed z-changelog-bg inset-0")}
          onClick={(e) => {
            props.onClose();
            e.stopPropagation();
          }}
        />
        <div
          className={clsx(
            "absolute top-full mt-1 w-max z-changelog",
            // gap-3 + menu(実測2rem)
            "-right-11"
          )}
        >
          <Box
            classNameOuter={clsx(
              "w-max h-max",
              // ここの3remは適当
              "origin-[calc(100%-3rem)_0]",
              "shadow-modal",
              "transition-all duration-200",
              popupAppearing
                ? "ease-in scale-100 opacity-100"
                : "ease-out scale-0 opacity-0"
            )}
          >
            <div
              className={clsx(
                "w-120 m-4 h-80 overflow-hidden",
                "mask-b-from-85% mask-b-to-97%"
              )}
            >
              <p className="text-center">
                <span>Falling Nikochan</span>
                <span className="ml-2">ver.</span>
                <span className="ml-1">{process.env.buildVersion}</span>
                {/*process.env.buildCommit && (
                  <span className="ml-1 text-sm">
                    ({process.env.buildCommit})
                  </span>
                )*/}
              </p>
              <h3 className="fn-heading-sect text-center mb-2">
                {t("changelog")}
              </h3>
              <div className="fn-mdx-changelog">
                <ChangeLog />
              </div>
            </div>
            <div className={clsx("absolute bottom-4 inset-x-0")}>
              <Link
                className={clsx("block w-max mx-auto mt-2", "fn-link-1")}
                href={`/${props.locale}/main/version`}
                prefetch={process.env.PREFETCH as "auto"}
              >
                {t("showAll")}
                <ArrowRight
                  className="inline-block align-middle ml-2 "
                  theme="filled"
                />
              </Link>
            </div>
          </Box>
        </div>
      </>
    )
  );
}
