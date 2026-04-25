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
import { Key } from "./common/key.js";
import Youtube from "@icon-park/react/lib/icons/Youtube.js";

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
    <main
      className={clsx(
        "w-full h-full overflow-x-clip overflow-y-auto",
        "flex flex-col items-center *:max-w-main"
      )}
    >
      <section className="min-h-screen flex flex-col items-center justify-center gap-12">
        <h1 className="text-8xl semibold-by-stroke">Falling Nikochan</h1>
        <p className="text-2xl">{t("description")}</p>
        <Link href={`/${locale}/main/play`} className="fn-button fn-cta">
          <span className="fn-glass-1" />
          <span className="fn-glass-2" />
          <ButtonHighlight />
          {t("playNow")}
        </Link>
      </section>

      <FestivalLink {...fes} className="my-2 px-6 text-center " />
      <RedirectedWarning />
      <PWAInstallMain />

      <section className="text-center px-6 mb-12">
        <h2 className="fn-heading-sect text-3xl mb-4">{t("popular")}</h2>
        {/*TODO: カードの形を変える*/}
        <ChartList
          type="popular"
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

      <section className="mb-12 flex w-full">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-12">
          <h2 className="fn-heading-sect text-3xl mb-4">
            {t("howToPlay.title")}
          </h2>
          <div className="mb-4 space-y-2">
            <p>{t("howToPlay.content1")}</p>
            <p>{t("howToPlay.content2")}</p>
          </div>
          <div className="mb-4 space-y-2">
            <p>{t("howToPlay.content3")}</p>
            {/*優先的に改行してほしい位置にinlineBlockを入れる*/}
            <p>
              {t.rich("howToPlay.content4", {
                key: (c) => <Key>{String(c)}</Key>,
                inlineBlock: (c) => <span className="inline-block">{c}</span>,
              })}
            </p>
            <p>{t("howToPlay.content5")}</p>
          </div>
          <Link href={`/${locale}/main/play`} className="fn-button fn-cta">
            <span className="fn-glass-1" />
            <span className="fn-glass-2" />
            <ButtonHighlight />
            {t("playNow")}
          </Link>
        </div>
        <div className="basis-2/5 border">イメージ画像</div>
      </section>

      <section className="mb-12 flex flex-row-reverse w-full">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-12">
          <h2 className="fn-heading-sect text-3xl mb-4">
            {t("howToEdit.title")}
          </h2>
          <div className="mb-4 space-y-2">
            <p>{t("howToEdit.content1")}</p>
            <p>
              {t.rich("howToEdit.content2", {
                youtube: (c) => (
                  <span className="relative inline-block">
                    <Youtube
                      className="absolute left-0.5 bottom-1"
                      theme="filled"
                    />
                    <span className="ml-5 mr-1">{c}</span>
                  </span>
                ),
              })}
            </p>
            <p>
              {t.rich("howToEdit.content3", {
                small: (c) => <span className="text-sm">{c}</span>,
                linkPolicies: (c) => (
                  <Link
                    href={`/${locale}/main/policies`}
                    className={clsx("fn-link-3")}
                    prefetch={process.env.PREFETCH as "auto"}
                  >
                    {c}
                  </Link>
                ),
              })}
            </p>
          </div>
          <div className="mb-4 space-y-2">
            <p>{t("howToEdit.content4")}</p>
            <p>
              {t.rich("howToEdit.content5", {
                url: () => <SmallDomainShare />,
              })}
            </p>
          </div>
          <Link href={`/${locale}/main/edit`} className="fn-button fn-cta">
            <span className="fn-glass-1" />
            <span className="fn-glass-2" />
            <ButtonHighlight />
            {t("editNow")}
          </Link>
        </div>
        <div className="basis-2/5 border">イメージ画像</div>
      </section>

      <PCFooter locale={locale} />
      <div className="flex-none basis-mobile-footer no-pc" />
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
      <h3>
        <span className="fn-heading-sect">{t("inputId")}:</span>
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
