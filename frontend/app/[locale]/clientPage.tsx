"use client";

import clsx from "clsx/lite";
import Link from "next/link";
import Title from "./common/titleLogo.js";
import { RedirectedWarning } from "./common/redirectedWarning.js";
import { PWAInstallMain, requestReview } from "./common/pwaInstall.js";
import {
  MobileFooterWithGradient,
  PCFooter,
  pcTabTitleKeys,
  tabURLs,
} from "./common/footer.js";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import Input from "./common/input.jsx";
import { ChartBrief, CidSchema, popularDays } from "@falling-nikochan/chart";
import { SlimeSVG } from "./common/slime.jsx";
import { SmallDomainShare } from "./common/small.jsx";
import { fetchBrief } from "./common/briefCache.js";
import * as v from "valibot";
import { ChartList } from "./main/chartList.jsx";
import { FestivalLink, useFestival } from "./common/festival.jsx";
import { useSharePageModal } from "./common/sharePageModal.jsx";
import { useDelayedDisplayState } from "./common/delayedDisplayState.js";
import {
  skyFlatButtonBorderStyle1,
  skyFlatButtonBorderStyle2,
  skyFlatButtonStyle,
} from "./common/flatButton.jsx";
import { ButtonHighlight } from "./common/button.jsx";
import { AboutContent } from "./main/about/[aboutIndex]/aboutContents.js";
import ArrowRight from "@icon-park/react/lib/icons/ArrowRight";

interface Props {
  locale: string;
}
export default function TopPage(props: Props) {
  const router = useRouter();
  const t = useTranslations("main");
  const [menuMove, menuMoveAnim, setMenuMove] = useDelayedDisplayState(200);
  const { locale } = props;
  const { openModal, openShareInternal } = useSharePageModal();
  const fes = useFestival();

  return (
    <main className="w-full h-full overflow-x-clip overflow-y-auto ">
      <div className="flex flex-col w-full min-h-full h-max items-center">
        {/* Hero Section with larger centered title and video placeholder */}
        <section className="relative w-full flex flex-col items-center pt-8 pb-12 px-6">
          {/* Background video placeholder */}
          <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div className="w-full h-full bg-gradient-to-b from-sky-100/30 to-transparent dark:from-sky-900/20 dark:to-transparent">
              {/* Placeholder for future gameplay video */}
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <span className="text-sm text-gray-500">Background Video Placeholder</span>
              </div>
            </div>
          </div>

          {/* Larger centered title logo */}
          <div className="relative mb-8 scale-150">
            <Title anim />
          </div>

          {/* Site description */}
          <p className="text-center text-lg mb-6 max-w-2xl">
            {t("description")}
          </p>

          {/* Primary CTA Button - "Play Now" */}
          <Link
            href={`/${locale}/main/play`}
            className={clsx(
              "relative px-8 py-4 text-xl font-bold font-title rounded-2xl",
              "shadow-lg hover:shadow-xl transition-all duration-200",
              skyFlatButtonStyle,
              "mb-4"
            )}
            prefetch={!process.env.NO_PREFETCH}
            onClick={() => requestReview()}
          >
            <span className={skyFlatButtonBorderStyle1} />
            <span className={skyFlatButtonBorderStyle2} />
            <ButtonHighlight />
            {t("play.title")}
          </Link>

          <FestivalLink {...fes} className="mt-2" />
        </section>

        {/* Warnings and PWA install */}
        <div className="w-full px-6 max-w-4xl">
          <RedirectedWarning />
          <PWAInstallMain />
        </div>

        {/* Popular Charts Showcase */}
        <section className="w-full px-6 py-8 max-w-6xl">
          <h2 className="text-2xl font-bold font-title text-center mb-2">
            {t("play.popular")}
          </h2>
          <p className="text-center text-sm mb-4 opacity-80">
            {t("play.popularDesc", { popularDays })}
          </p>
          <ChartList
            type="popular"
            creator
            href={(cid) => `/share/${cid}`}
            onClick={openModal}
            onClickMobile={openShareInternal}
            showLoading
            badge
            fixedRows
          />
          <div className="text-center mt-4">
            <Link
              href={`/${locale}/main/play`}
              className={clsx("inline-flex items-center gap-2", "text-sky-600 dark:text-sky-400 hover:underline")}
            >
              {t("chartList.showAll")}
              <ArrowRight className="inline-block" />
            </Link>
          </div>
        </section>

        {/* Scroll-based "What is Falling Nikochan?" Section */}
        <section className="w-full px-6 py-12 bg-sky-50/50 dark:bg-sky-950/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold font-title text-center mb-8">
              {t("aboutNikochan")}
            </h2>
            
            {/* About Content 1 - Overview */}
            <div className="mb-8 p-6 bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow">
              <AboutContent index={1} locale={locale} />
            </div>

            {/* About Content 2 - How to Play */}
            <div className="mb-8 p-6 bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow">
              <AboutContent index={2} locale={locale} />
            </div>

            {/* About Content 3 - Create Charts */}
            <div className="mb-8 p-6 bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow">
              <AboutContent index={3} locale={locale} />
            </div>

            {/* Link to full about pages */}
            <div className="text-center">
              <Link
                href={`/${locale}/main/about/1`}
                className={clsx("inline-flex items-center gap-2", "text-sky-600 dark:text-sky-400 hover:underline")}
              >
                {t("about.title")}
                <ArrowRight className="inline-block" />
              </Link>
            </div>
          </div>
        </section>

        {/* Search/ID Input Section */}
        <section className="w-full px-6 py-8 max-w-4xl">
          <h3 className="text-xl font-semibold font-title text-center mb-4">
            {t("inputId")}
          </h3>
          <InputCId
            openModal={openModal}
            openShareInternal={openShareInternal}
          />
        </section>

        {/* Recently Played Charts */}
        <section className="w-full px-6 py-8 max-w-6xl">
          <h3 className="text-2xl font-bold font-title text-center mb-4">
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
        </section>

        {/* Navigation for PC (animated slide-in) */}
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
            "flex-col justify-center w-main-nav",
            "transition ease-out duration-200"
          )}
          style={{
            transform: menuMove
              ? "translateX(max(calc(var(--container-main) / -2), calc((100vw - var(--container-main-nav) - var(--spacing) * 12) / -2)))"
              : undefined,
          }}
        >
          {pcTabTitleKeys.map((key, i) => (
            <Link
              key={i}
              href={`/${locale}${tabURLs[key]}`}
              className={clsx(
                "text-center rounded-2xl py-3 pl-2 pr-2",
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
        <div className="flex-none basis-mobile-footer main-wide:hidden " />
      </div>
      <MobileFooterWithGradient locale={locale} tabKey="top" />
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

  const inputProps = {
    actualValue: "",
    isValid: (t: string) => v.safeParse(CidSchema(), t).success,
    left: true,
  };
  
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Input
          {...inputProps}
          className="flex-1 min-w-0 hidden main-wide:inline-block"
          updateValue={(cid: string) => gotoCId(cid, false)}
        />
        <Input
          {...inputProps}
          className="flex-1 min-w-0 main-wide:hidden"
          updateValue={(cid: string) => gotoCId(cid, true)}
        />
        {cidFetching && (
          <span className="flex items-center gap-2">
            <SlimeSVG />
            <span className="text-sm">Loading...</span>
          </span>
        )}
      </div>
      {cidErrorMsg && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-2">{cidErrorMsg}</p>
      )}
      <p className="text-sm text-center opacity-80">
        {t("inputIdDesc")}
        {t.rich("inputIdDesc2", {
          url: () => <SmallDomainShare />,
        })}
      </p>
    </div>
  );
}
