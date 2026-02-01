"use client";

import clsx from "clsx/lite";
import Link from "next/link";
import { TitleAsLink } from "./common/titleLogo.js";
import { RedirectedWarning } from "./common/redirectedWarning.js";
import { PWAInstallMain, requestReview } from "./common/pwaInstall.js";
import {
  MobileFooter,
  PCFooter,
  pcTabTitleKeys,
  tabURLs,
} from "./common/footer.js";
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
import { AboutModal } from "./common/aboutModal.jsx";
import { ButtonHighlight } from "./common/button.jsx";
import { AboutDescription } from "./main/main.jsx";

interface Props {
  locale: string;
}
export default function TopPage(props: Props) {
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
    <main className="w-full h-full overflow-x-clip overflow-y-auto">
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
        <TitleAsLink className="grow-3 shrink-0" locale={locale} />
        <div className="basis-0 flex-1 " />
        <AboutDescription
          className="my-2 px-6"
          locale={locale}
          onClickAbout={() => setAboutPageIndex(1)}
        />
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
          <h3 className="mb-2 text-xl font-semibold font-title">
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
            "no-mobile flex",
            "flex-col justify-center w-main-nav",
            "transition ease-out duration-200"
          )}
          style={{
            transform: menuMove
              ? // 挿入されるBoxのサイズは (w-main) or (100% - w-main-nav - p-6)
                "translateX(max(calc(var(--container-main) / -2), calc((100vw - var(--container-main-nav) - var(--spacing) * 12) / -2)))"
              : undefined,
          }}
        >
          {pcTabTitleKeys.map((key, i) => (
            <Link
              key={i}
              href={`/${locale}${tabURLs[key]}`}
              className={clsx("fn-main-nav-item fn-flat-button fn-sky")}
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
              <span className="fn-glass-1" />
              <span className="fn-glass-2" />
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
        <div className="flex-none basis-mobile-footer no-pc" />
      </div>
      <MobileFooter
        className="fixed bottom-0"
        blurBg
        locale={locale}
        tabKey="top"
      />
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
        <span className="text-xl font-semibold font-title">
          {t("inputId")}:
        </span>
        <Input
          className="ml-4 w-20 no-mobile"
          actualValue=""
          updateValue={(cid: string) => gotoCId(cid, false)}
          isValid={(t) => v.safeParse(CidSchema(), t).success}
          left
        />
        <Input
          className="ml-4 w-20 no-pc"
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
