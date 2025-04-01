"use client";

import {
  ChartLineBrief,
  chartListMaxRow,
  fetchAndFilterBriefs,
} from "./fetch.js";
import { useCallback, useEffect, useState } from "react";
import { getRecent, updateRecent } from "@/common/recent.js";
import { IndexMain } from "../main.js";
import Input from "@/common/input.js";
import { AccordionLike, ChartList } from "../chartList.js";
import { ExternalLink } from "@/common/extLink.js";
import { Youtube } from "@icon-park/react";
import {
  ChartBrief,
  CidSchema,
  originalCId,
  popularDays,
  RecordGetSummary,
  sampleCId,
} from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { SmallDomainShare } from "@/common/small";
import { useDisplayMode } from "@/scale.js";
import { fetchBrief } from "@/common/briefCache.js";
import { Box, modalBg } from "@/common/box.js";
import { ShareBox } from "@/share/placeholder/shareBox.js";
import { titleShare, titleWithSiteName } from "@/common/title.js";
import * as v from "valibot";
import { SlimeSVG } from "@/common/slime.js";
import { useShareModal } from "./shareModal.jsx";

export default function PlayTab({ locale }: { locale: string }) {
  const t = useTranslations("main.play");
  const te = useTranslations("error");
  const { isMobileMain } = useDisplayMode();

  const [popularBrief, setPopularBrief] = useState<
    ChartLineBrief[] | "error" | undefined
  >(undefined);
  const [latestBrief, setLatestBrief] = useState<
    ChartLineBrief[] | "error" | undefined
  >(undefined);
  const [originalBrief, setOriginalBrief] = useState<ChartLineBrief[]>(originalCId.map((cid) => ({ cid, fetched: false, original: true })));
  const [sampleBrief, setSampleBrief] = useState<ChartLineBrief[]>(sampleCId.map((cid) => ({ cid, fetched: false })));

  const {modal, openModal} = useShareModal(locale);

  useEffect(() => {
    void (async () => {
      try {
        const latestRes = await fetch(
          process.env.BACKEND_PREFIX + `/api/latest`,
          {
            cache: "default",
          },
        );
        if (latestRes.ok) {
          const latestCId = (await latestRes.json()) as { cid: string }[];
          setLatestBrief(latestCId.map(({ cid }) => ({ cid, fetched: false })));
        } else {
          setLatestBrief("error");
        }
      } catch (e) {
        console.error(e);
        setLatestBrief("error");
      }
    })();
    void (async () => {
      try {
        const popularRes = await fetch(
          process.env.BACKEND_PREFIX + `/api/popular`,
          {
            cache: "default",
          },
        );
        if (popularRes.ok) {
          const popularCId = (await popularRes.json()) as { cid: string }[];
          setPopularBrief(
            popularCId.map(({ cid }) => ({ cid, fetched: false })),
          );
        } else {
          setPopularBrief("error");
        }
      } catch (e) {
        console.error(e);
        setPopularBrief("error");
      }
    })();
  }, []);
  useEffect(() => {
    void (async () => {
      if (Array.isArray(latestBrief)) {
        const { changed, briefs } = await fetchAndFilterBriefs(
          latestBrief,
          false,
        );
        if (changed) {
          setLatestBrief(briefs);
        }
      }
    })();
  }, [latestBrief]);
  useEffect(() => {
    void (async () => {
      if (Array.isArray(popularBrief)) {
        const { changed, briefs } = await fetchAndFilterBriefs(
          popularBrief,
          false,
        );
        if (changed) {
          setPopularBrief(briefs);
        }
      }
    })();
  }, [popularBrief]);
  useEffect(() => {
    void (async () => {
      if (originalBrief) {
        const { changed, briefs } = await fetchAndFilterBriefs(
          originalBrief,
          true,
        );
        if (changed) {
          setOriginalBrief(briefs);
        }
      }
    })();
  }, [originalBrief]);
  useEffect(() => {
    void (async () => {
      if (sampleBrief) {
        const { changed, briefs } = await fetchAndFilterBriefs(
          sampleBrief,
          true,
        );
        if (changed) {
          setSampleBrief(briefs);
        }
      }
    })();
  }, [sampleBrief]);

  return (
    <IndexMain
      title={t("title")}
      tabKey="play"
      locale={locale}
      modal={modal}
    >
      <AccordionLike
        hidden={showExclusiveMode !== null && showExclusiveMode !== "popular"}
        expanded={showAllMode === "popular"}
        reset={() => window.history.back()}
        header={
          <span className="text-xl font-bold font-title">{t("popular")}</span>
        }
      >
        <p className="pl-2 mb-1 text-justify ">
          {t("popularDesc", { popularDays })}
        </p>
        <ChartList
          recentBrief={popularBrief}
          maxRow={chartListMaxRow}
          fetchAdditional={() => setFetchPopularAll(true)}
          creator
          href={(cid) => `/share/${cid}`}
          onClick={(cid) => {
            if (Array.isArray(popularBrief))
              openModal(cid, popularBrief.find((b) => b.cid === cid)?.brief);
          }}
          showLoading
          additionalOpen={showAllMode === "popular"}
          setAdditionalOpen={(open) => {
            if (open) {
              goExclusiveMode("popular");
            } else {
              window.history.back();
            }
          }}
        />
      </AccordionLike>
      <AccordionLike
        hidden={showExclusiveMode !== null && showExclusiveMode !== "latest"}
        expanded={showAllMode === "latest"}
        reset={() => window.history.back()}
        header={
          <span className="text-xl font-bold font-title">{t("latest")}</span>
        }
      >
        <p className="pl-2 text-justify ">
          {t("latestDesc")}
          {/*<span className="text-sm ">(最新の{numLatest}件まで)</span>*/}
        </p>
        <p className="pl-2 mb-1 text-justify text-sm ">({t("latestDesc2")})</p>
        <ChartList
          recentBrief={latestBrief}
          maxRow={chartListMaxRow}
          fetchAdditional={() => setFetchLatestAll(true)}
          creator
          href={(cid) => `/share/${cid}`}
          onClick={(cid) => {
            if (Array.isArray(latestBrief))
              openModal(cid, latestBrief.find((b) => b.cid === cid)?.brief);
          }}
          showLoading
          dateDiff
          additionalOpen={showAllMode === "latest"}
          setAdditionalOpen={(open) => {
            if (open) {
              goExclusiveMode("latest");
            } else {
              window.history.back();
            }
          }}
        />
      </AccordionLike>
      <AccordionLike
        hidden={showExclusiveMode !== null}
        header={
          <span className="text-xl font-bold font-title">{t("sample")}</span>
        }
      >
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
          recentBrief={originalBrief?.concat(sampleBrief || [])}
          maxRow={(originalBrief?.length || 0) + (sampleBrief?.length || 0)}
          href={(cid) => `/share/${cid}`}
          onClick={(cid) =>
            openModal(
              cid,
              originalBrief
                ?.concat(sampleBrief || [])
                .find((b) => b.cid === cid)?.brief,
            )
          }
          showLoading
          additionalOpen={false}
          setAdditionalOpen={() => undefined}
        />
      </AccordionLike>
    </IndexMain>
  );
}
