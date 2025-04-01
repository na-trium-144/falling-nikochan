"use client";

import { IndexMain } from "../main.js";
import { ChartList } from "../chartList.js";
import { ExternalLink } from "@/common/extLink.js";
import { Youtube } from "@icon-park/react";
import { popularDays } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { useShareModal } from "../shareModal.jsx";

export default function PlayTab({ locale }: { locale: string }) {
  const t = useTranslations("main.play");

  const { modal, openModal } = useShareModal(locale);

  return (
    <IndexMain
      title={t("title")}
      tabKey="play"
      mobileTabKey="play"
      locale={locale}
      modal={modal}
    >
      <div className="flex-none mb-3 ">
        <h3 className="mb-2 text-xl font-bold font-title">{t("popular")}</h3>
        <p className="pl-2 mb-1 text-justify ">
          {t("popularDesc", { popularDays })}
        </p>
        <ChartList
          type="popular"
          creator
          href={(cid) => `/share/${cid}`}
          onClick={openModal}
          showLoading
          moreHref={`/${locale}/main/popular`}
        />
      </div>
      <div className="flex-none mb-3 ">
        <h3 className="mb-2 text-xl font-bold font-title">{t("latest")}</h3>
        <p className="pl-2 text-justify ">
          {t("latestDesc")}
          {/*<span className="text-sm ">(最新の{numLatest}件まで)</span>*/}
        </p>
        <p className="pl-2 mb-1 text-justify text-sm ">({t("latestDesc2")})</p>
        <ChartList
          type="latest"
          creator
          href={(cid) => `/share/${cid}`}
          onClick={openModal}
          showLoading
          dateDiff
          moreHref={`/${locale}/main/latest`}
        />
      </div>
      <div className="flex-none mb-3 ">
        <h3 className="mb-2 text-xl font-bold font-title">{t("sample")}</h3>
        <p className="pl-2 mb-1 text-justify ">
          {t.rich("sampleDesc", {
            small: (c) => <span className="text-sm mx-0.5">{c}</span>,
          })}
          {t.rich("sampleDesc2", {
            youtube: (c) => (
              <ExternalLink
                className="mx-1"
                href="https://www.youtube.com/@nikochan144"
                icon={
                  <Youtube
                    className="absolute left-0 bottom-1"
                    theme="filled"
                  />
                }
              >
                <span className="text-sm">{c}</span>
              </ExternalLink>
            ),
          })}
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="pl-2 mb-1 text-justify text-sm ">
            ({t("sampleDevonly")})
          </p>
        )}
        <ChartList
          type="sample"
          fetchAll
          href={(cid) => `/share/${cid}`}
          onClick={openModal}
          showLoading
          moreHref=""
        />
      </div>
    </IndexMain>
  );
}
