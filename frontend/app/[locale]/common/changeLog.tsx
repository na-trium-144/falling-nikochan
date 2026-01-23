"use client";

import clsx from "clsx/lite";
import { createContext, ReactNode, useContext, useEffect } from "react";
import { Box } from "./box";
import Link from "next/link";
import { linkStyle1 } from "./linkStyle";
import { useTranslations } from "next-intl";
import ArrowRight from "@icon-park/react/lib/icons/ArrowRight";
import { updateLastVisited } from "./version";
import { useDelayedDisplayState } from "./delayedDisplayState";

const ChangeLogContext = createContext<ReactNode>(null);
export const useChangeLog = () => useContext(ChangeLogContext);
export function ChangeLogProvider(props: {
  children: ReactNode;
  changeLog: ReactNode;
}) {
  return (
    <ChangeLogContext.Provider value={props.changeLog}>
      {props.children}
    </ChangeLogContext.Provider>
  );
}

interface PopupProps {
  locale: string;
  open: boolean;
  onClose: () => void;
}
export function ChangeLogPopup(props: PopupProps) {
  const t = useTranslations("main.version");
  const changeLog = useChangeLog();
  const [popupOpened, popupAppearing, setPopupOpened] =
    useDelayedDisplayState(200);
  useEffect(() => {
    if (props.open) {
      updateLastVisited();
    }
    setPopupOpened(props.open);
  }, [props.open, setPopupOpened]);
  return (
    popupOpened && (
      <>
        <div
          className={clsx("fixed z-20 inset-0")}
          onClick={(e) => {
            props.onClose();
            e.stopPropagation();
          }}
        />
        <div
          className={clsx(
            "absolute bottom-full mb-1 left-1/2 w-0 z-30",
            "grid place-content-center place-items-center grid-rows-1 grid-cols-1"
          )}
        >
          <Box
            classNameOuter={clsx(
              "w-max h-max origin-bottom",
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
              <p className="">
                <span className="inline-block">Falling Nikochan</span>
                <span className="inline-block">
                  <span className="ml-2">ver.</span>
                  <span className="ml-1">{process.env.buildVersion}</span>
                  {/*process.env.buildCommit && (
                  <span className="ml-1 text-sm">
                    ({process.env.buildCommit})
                  </span>
                )*/}
                </span>
              </p>
              <h3 className="text-xl font-semibold font-title">{t("changelog")}</h3>
              <div className="text-left ">{changeLog}</div>
            </div>
            <div className={clsx("absolute bottom-4 inset-x-0")}>
              <Link
                className={clsx("block w-max mx-auto mt-2", linkStyle1)}
                href={`/${props.locale}/main/version`}
                prefetch={!process.env.NO_PREFETCH}
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
