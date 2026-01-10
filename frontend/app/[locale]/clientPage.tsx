"use client";

import clsx from "clsx/lite";
import Link from "next/link";
import { linkStyle1, linkStyle3 } from "./common/linkStyle.js";
import Title from "./common/titleLogo.js";
import { RedirectedWarning } from "./common/redirectedWarning.js";
import { PWAInstallMain, requestReview } from "./common/pwaInstall.js";
import {
  MobileFooter,
  PCFooter,
  pcTabTitleKeys,
  tabURLs,
} from "./common/footer.js";
import { useDisplayMode } from "./scale.js";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import Input from "./common/input.jsx";
import { ChartBrief, CidSchema } from "@falling-nikochan/chart";
import { SlimeSVG } from "./common/slime.jsx";
import { SmallDomainShare } from "./common/small.jsx";
import { fetchBrief } from "./common/briefCache.js";
import * as v from "valibot";
import { ChartList } from "./main/chartList.jsx";
import { FestivalLink, useFestival } from "./common/festival.jsx";
import { useSharePageModal } from "./common/sharePageModal.jsx";
import { useDelayedDisplayState } from "./common/delayedDisplayState.js";
import ArrowRight from "@icon-park/react/lib/icons/ArrowRight.js";
import { AboutModal } from "./common/aboutModal.jsx";
import {
  skyFlatButtonBorderStyle1,
  skyFlatButtonBorderStyle2,
  skyFlatButtonStyle,
} from "./common/flatButton.jsx";
import { ButtonHighlight } from "./common/button.jsx";

interface Props {
  locale: string;
}
export default function TopPage(props: Props) {
  const { screenWidth, rem } = useDisplayMode();
  const router = useRouter();
  const t = useTranslations("main");
  const [menuMove, menuMoveAnim, setMenuMove] = useDelayedDisplayState(200);
  const menuMoveAnimClass =
    "min-h-0 shrink-2 transition-opacity duration-200 ease-linear " +
    (menuMoveAnim ? "opacity-0 " : "opacity-100 ");
  const { locale } = props;
  const { openModal, openShareInternal } = useSharePageModal();
  const [aboutPageIndex, setAboutPageIndex_] = useState<number | null>(null);
  const [aboutOpen, aboutAnim, setAboutOpen_] = useDelayedDisplayState(200);
  const setAboutPageIndex = useCallback(
    (i: number | null) => {
      setAboutOpen_(i !== null, () => setAboutPageIndex_(i));
    },
    [setAboutOpen_]
  );
  const fes = useFestival();

  return (
    <main className="w-full h-full overflow-x-clip overflow-y-auto ">
      {aboutPageIndex !== null && aboutOpen ? (
        <AboutModal
          aboutAnim={aboutAnim}
          aboutPageIndex={aboutPageIndex}
          setAboutPageIndex={setAboutPageIndex}
          locale={props.locale}
        />
      ) : null}
      <div
        className={clsx(
          "flex flex-col w-full min-h-full h-max items-center",
          menuMove &&
            clsx(
              "transition-[max-height] duration-200 ease-out",
              menuMoveAnim ? "max-h-full" : "max-h-max"
            )
        )}
      >
        <Link
          href={`/${locale}`}
          className={clsx(
            "w-full grow-3 shrink-0 basis-24 relative",
            linkStyle1
          )}
          style={{
            marginLeft: "-20rem",
            marginRight: "-20rem",
          }}
          prefetch={!process.env.NO_PREFETCH}
        >
          <Title className="absolute inset-0 " anim />
        </Link>
        <div className="basis-0 flex-1 " />
        <div className="grow-0 my-2 text-center px-6">
          {t("description")}
          <Link
            href={`/${locale}/main/about/1`}
            className={clsx(
              "main-wide:hidden inline-block",
              "ml-2",
              linkStyle3
            )}
          >
            {t("aboutNikochan")}
            <ArrowRight
              className="inline-block align-middle ml-2 "
              theme="filled"
            />
          </Link>
          <button
            className={clsx(
              "hidden main-wide:inline-block",
              "ml-2",
              linkStyle3
            )}
            onClick={() => setAboutPageIndex(1)}
          >
            {t("aboutNikochan")}
            <ArrowRight
              className="inline-block align-middle ml-2 "
              theme="filled"
            />
          </button>
        </div>
        <FestivalLink {...fes} className="grow-0 mb-3 px-6 text-center " />
        <div className={clsx("basis-auto grow-2", menuMoveAnimClass)}>
          <RedirectedWarning />
          <PWAInstallMain />
        </div>
        <div
          className={clsx(
            "basis-auto grow-1 my-auto h-max mb-3 text-center px-6",
            menuMoveAnimClass
          )}
        >
          <InputCId
            openModal={openModal}
            openShareInternal={openShareInternal}
          />
        </div>

        <div
          className={clsx(
            "basis-auto grow-1 my-auto h-max mb-3 text-center w-full px-6",
            menuMoveAnimClass
          )}
        >
          <h3 className="mb-2 text-xl font-bold font-title">
            {t("play.recent")}
          </h3>
          <ChartList
            type="recent"
            creator
            href={(cid) => `/share/${cid}`}
            onClick={openModal}
            onClickMobile={openShareInternal}
            showLoading
            moreHref={`/${locale}/main/recent`}
            badge
            fixedRows
          />
        </div>

        <div
          className={clsx(
            "shrink-1 h-dvh transition-all duration-200 ease-in",
            menuMoveAnim ? "max-h-[50vh]" : "max-h-0"
          )}
        />
        <nav
          className={clsx(
            "shrink-0 basis-auto grow-3",
            "hidden main-wide:flex",
            "flex-col justify-center w-64",
            "transition ease-out duration-200"
          )}
          style={{
            transform: menuMove
              ? `translateX(-${
                  (screenWidth - (64 / 4) * rem - (12 / 4) * rem) / 2
                }px)`
              : undefined,
          }}
        >
          {pcTabTitleKeys.map((key, i) => (
            <Link
              key={i}
              href={`/${locale}${tabURLs[key]}`}
              className={clsx(
                "text-center rounded-box py-3 pl-2 pr-2",
                skyFlatButtonStyle
              )}
              prefetch={!process.env.NO_PREFETCH}
              onClick={(e) => {
                requestReview();
                setMenuMove(true);
                setTimeout(() => {
                  router.push(`/${locale}${tabURLs[key]}`);
                }, 150);
                e.preventDefault();
              }}
            >
              <span className={skyFlatButtonBorderStyle1} />
              <span className={skyFlatButtonBorderStyle2} />
              <ButtonHighlight />
              {t(key + ".title")}
            </Link>
          ))}
        </nav>
        <div
          className={clsx(
            "shrink-1 h-dvh transition-all duration-200 ease-in",
            menuMoveAnim ? "max-h-[50vh]" : "max-h-0"
          )}
        />

        <PCFooter locale={locale} />
        <div className="flex-none basis-15 main-wide:hidden " />
      </div>
      <div
        className={clsx(
          "fixed bottom-0 inset-x-0 backdrop-blur-2xs",
          "bg-gradient-to-t from-30% from-sky-50 to-sky-50/0",
          "dark:from-orange-950 dark:to-orange-950/0"
        )}
      >
        <MobileFooter locale={locale} tabKey="top" />
      </div>
    </main>
  );
}

function InputCId(props: {
  openModal: (cid: string, brief?: ChartBrief) => void;
  openShareInternal: (cid: string, brief?: ChartBrief) => void;
}) {
  const t = useTranslations("main");
  const te = useTranslations("error");
  const [cidErrorMsg, setCIdErrorMsg] = useState<string>("");
  const [cidFetching, setCidFetching] = useState<boolean>(false);
  const gotoCId = async (cid: string, isMobile: boolean) => {
    setCIdErrorMsg("");
    setCidFetching(true);
    const res = await fetchBrief(cid, true);
    if (res.ok) {
      // router.push(`/share/${cid}`);
      if (isMobile) {
        props.openShareInternal(cid, res.brief);
      } else {
        props.openModal(cid, res.brief);
      }
    } else {
      if (res.is404) {
        setCIdErrorMsg(te("api.chartIdNotFound"));
      } else {
        setCIdErrorMsg(te("unknownApiError"));
      }
    }
    setCidFetching(false);
  };
  return (
    <>
      <h3 className="mb-2 ">
        <span className="text-xl font-bold font-title">{t("inputId")}:</span>
        <Input
          className="ml-4 w-20 hidden main-wide:inline-block "
          actualValue=""
          updateValue={(cid: string) => gotoCId(cid, false)}
          isValid={(t) => v.safeParse(CidSchema(), t).success}
          left
        />
        <Input
          className="ml-4 w-20 main-wide:hidden"
          actualValue=""
          updateValue={(cid: string) => gotoCId(cid, true)}
          isValid={(t) => v.safeParse(CidSchema(), t).success}
          left
        />
        <span className={clsx(cidFetching ? "inline-block" : "hidden")}>
          <SlimeSVG />
          Loading...
        </span>
        <span className="ml-1 inline-block">{cidErrorMsg}</span>
      </h3>
      <p className="">
        {t("inputIdDesc")}
        {t.rich("inputIdDesc2", {
          url: () => <SmallDomainShare />,
        })}
      </p>
    </>
  );
}
