"use client";

import Link from "next/link";
import { linkStyle1 } from "./common/linkStyle.js";
import Title from "./common/titleLogo.js";
import { RedirectedWarning } from "./common/redirectedWarning.js";
import { PWAInstallMain, usePWAInstall } from "./common/pwaInstall.js";
import {
  MobileFooter,
  PCFooter,
  pcTabTitleKeys,
  tabURLs,
} from "./common/footer.js";
import { useDisplayMode } from "./scale.js";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Input from "./common/input.jsx";
import { ChartBrief, CidSchema } from "@falling-nikochan/chart";
import { SlimeSVG } from "./common/slime.jsx";
import { SmallDomainShare } from "./common/small.jsx";
import { fetchBrief } from "./common/briefCache.js";
import { useShareModal } from "./main/shareModal.jsx";
import * as v from "valibot";
import { ChartList } from "./main/chartList.jsx";

export default function TopPage({ locale }: { locale: string }) {
  const { screenWidth, rem } = useDisplayMode();
  const router = useRouter();
  const pwa = usePWAInstall();
  const t = useTranslations("main");
  const [menuMoveLeft, setMenuMoveLeft] = useState<boolean>(false);
  const { modal, openModal } = useShareModal(locale);

  return (
    <main className="flex flex-col w-full h-full overflow-x-clip overflow-y-auto items-center ">
      {modal}
      <Link
        href={`/${locale}`}
        className={"w-full grow-3 shrink-0 basis-24 relative " + linkStyle1}
        style={{
          marginLeft: "-20rem",
          marginRight: "-20rem",
        }}
        prefetch={!process.env.NO_PREFETCH}
      >
        <Title className="absolute inset-0 " anim />
      </Link>
      <div className="basis-0 grow-1">
        <RedirectedWarning />
        <PWAInstallMain pwa={pwa} />
      </div>

      <div className="flex-none mb-3 text-center px-6 ">
        <InputCId openModal={openModal} />
      </div>
      {process.env.NODE_ENV === "development" && (
        <div className="flex-none mb-3 text-center px-6 ">
          <InputDirect locale={locale} />
        </div>
      )}

      <div className="flex-none mb-3 text-center w-full px-6 ">
        <h3 className="mb-2 text-xl font-bold font-title">
          {t("play.recent")}
        </h3>
        <ChartList
          type="recent"
          creator
          href={(cid) => `/share/${cid}`}
          onClick={openModal}
          showLoading
          moreHref={`/${locale}/main/recent`}
        />
      </div>

      <nav
        className={
          "shrink-0 basis-auto grow-6 " +
          "hidden main-wide:flex " +
          "flex-col justify-center w-60 " +
          "transition ease-out duration-200 "
        }
        style={{
          transform: menuMoveLeft
            ? `translateX(-${
                (screenWidth - (60 / 4) * rem - (12 / 4) * rem) / 2
              }px)`
            : undefined,
        }}
      >
        {pcTabTitleKeys.map((key, i) => (
          <Link
            key={i}
            href={`/${locale}${tabURLs[key]}`}
            className={
              " text-center hover:bg-sky-200 hover:dark:bg-orange-950 active:shadow-inner " +
              "rounded-lg p-3 "
            }
            prefetch={!process.env.NO_PREFETCH}
            onClick={(e) => {
              setMenuMoveLeft(true);
              setTimeout(() => {
                router.push(`/${locale}${tabURLs[key]}`);
              }, 150);
              e.preventDefault();
            }}
          >
            {t(key + ".title")}
          </Link>
        ))}
      </nav>
      <PCFooter locale={locale} pwa={pwa} />
      <div className="flex-none basis-14 main-wide:hidden " />
      <div
        className={
          "fixed bottom-0 inset-x-0 backdrop-blur-2xs " +
          "bg-gradient-to-t from-30% from-sky-50 to-sky-50/0 " +
          "dark:from-orange-950 dark:to-orange-950/0 "
        }
      >
        <MobileFooter locale={locale} pwa={pwa} />
      </div>
    </main>
  );
}

function InputCId(props: {
  openModal: (cid: string, brief?: ChartBrief) => void;
}) {
  const t = useTranslations("main");
  const te = useTranslations("error");
  const [cidErrorMsg, setCIdErrorMsg] = useState<string>("");
  const [cidFetching, setCidFetching] = useState<boolean>(false);
  const gotoCId = async (cid: string) => {
    setCIdErrorMsg("");
    setCidFetching(true);
    const res = await fetchBrief(cid, true);
    if (res.ok) {
      // router.push(`/share/${cid}`);
      props.openModal(cid, res.brief);
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
          className="ml-4 w-20"
          actualValue=""
          updateValue={gotoCId}
          isValid={(t) => v.safeParse(CidSchema(), t).success}
          left
        />
        <span className={cidFetching ? "inline-block " : "hidden "}>
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

function InputDirect(props: { locale: string }) {
  const t = useTranslations("main");
  return (
    <>
      <h4 className="mb-1 ">
        <span className="text-lg font-bold font-title">
          {t("inputDirect")}:
        </span>
        <Input
          className="ml-4 w-20"
          actualValue=""
          updateValue={(cid) =>
            window
              .open(`/${props.locale}/play?cid=${cid}&lvIndex=0`, "_blank")
              ?.focus()
          }
          isValid={(t) => v.safeParse(CidSchema(), t).success}
          left
        />
      </h4>
      <p className="text-sm ">({t("inputDirectDevonly")})</p>
    </>
  );
}
