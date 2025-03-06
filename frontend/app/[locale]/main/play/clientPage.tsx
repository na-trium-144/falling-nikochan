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
import { LoadingSlime } from "@/common/loadingSlime.js";
import { AccordionLike, ChartList } from "../chartList.js";
import { ExternalLink } from "@/common/extLink.js";
import { Youtube } from "@icon-park/react";
import {
  ChartBrief,
  originalCId,
  sampleCId,
  validCId,
} from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { SmallDomainShare } from "@/common/small";
import { useDisplayMode } from "@/scale.js";
import { fetchBrief } from "@/common/briefCache.js";
import { Box, modalBg } from "@/common/box.js";
import { ShareBox } from "@/share/placeholder/shareBox.js";
import { titleShare, titleWithSiteName } from "@/common/title.js";

export default function PlayTab({ locale }: { locale: string }) {
  const t = useTranslations("main.play");
  const th = useTranslations("share");
  const te = useTranslations("error");
  const { isMobileMain } = useDisplayMode();

  const [recentBrief, setRecentBrief] = useState<ChartLineBrief[]>();
  const [fetchRecentAll, setFetchRecentAll] = useState<boolean>(false);
  const [latestBrief, setLatestBrief] = useState<ChartLineBrief[]>();
  const [fetchLatestAll, setFetchLatestAll] = useState<boolean>(false);
  const [originalBrief, setOriginalBrief] = useState<ChartLineBrief[]>();
  const fetchOriginalAll = true;
  const [sampleBrief, setSampleBrief] = useState<ChartLineBrief[]>();
  const fetchSampleAll = true;

  // exclusiveをセット(指定したもの以外を非表示にする) → 200ms後、showAllをセット(指定したものの内容を全て表示する)
  // mobileではごちゃごちゃやってもスクロールが入るせいできれいに見えないので瞬時に切り替える
  const [showExclusiveMode, setShowExclusiveMode] = useState<
    null | "recent" | "latest"
  >(null);
  const [showAllMode, setShowAllMode] = useState<null | "recent" | "latest">(
    null
  );
  const goExclusiveMode = useCallback(
    (mode: "recent" | "latest") => {
      window.history.replaceState(null, "", "#"); // これがないとなぜか #recent から元のページにブラウザバックできなくなる場合があるけどなぜ?
      window.history.pushState(null, "", "#" + mode);
      setShowExclusiveMode(mode);
      if (isMobileMain) {
        setShowAllMode(mode);
        window.scrollTo(0, 0);
      } else {
        setTimeout(() => setShowAllMode(mode), 200);
      }
    },
    [isMobileMain]
  );

  const [modalCId, setModalCId] = useState<string | null>(null);
  const [modalBrief, setModalBrief] = useState<ChartBrief | null>(null);
  const [modalAppearing, setModalAppearing] = useState<boolean>(false);
  const openModal = (cid: string, brief: ChartBrief | undefined) => {
    if (brief) {
      if (window.location.pathname !== `/share/${cid}`) {
        // pushStateではpopstateイベントは発生しない
        window.history.pushState(null, "", `/share/${cid}`);
      }
      setModalCId(cid);
      setModalBrief(brief);
      document.title = titleShare(th, cid, brief);
      setTimeout(() => setModalAppearing(true));
    }
  };

  // modalのcloseと、exclusiveModeのリセットは window.history.back(); でpopstateイベントを呼び出しその中で行われる
  useEffect(() => {
    const handler = () => {
      if (window.location.pathname.startsWith("/share/")) {
        const cid = window.location.pathname.slice(7);
        fetchBrief(cid).then((res) => {
          openModal(cid, res.brief);
        });
      } else if (window.location.hash.length >= 2) {
        goExclusiveMode(window.location.hash.slice(1) as "recent" | "latest");
      } else {
        setShowAllMode(null);
        setShowExclusiveMode(null);
        setModalAppearing(false);
        document.title = titleWithSiteName(t("title"));
        setTimeout(() => {
          setModalCId(null);
          setModalBrief(null);
        }, 200);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [goExclusiveMode]);

  useEffect(() => {
    const recentCId = getRecent("play").reverse();
    setRecentBrief(recentCId.map((cid) => ({ cid, fetched: false })));
    setOriginalBrief(
      originalCId.map((cid) => ({ cid, fetched: false, original: true }))
    );
    setSampleBrief(sampleCId.map((cid) => ({ cid, fetched: false })));
    void (async () => {
      const latestCId = (await (
        await fetch(process.env.BACKEND_PREFIX + `/api/latest`, {
          cache: "default",
        })
      ).json()) as { cid: string }[];
      setLatestBrief(latestCId.map(({ cid }) => ({ cid, fetched: false })));
    })();
  }, []);
  useEffect(() => {
    void (async () => {
      if (recentBrief) {
        const { changed, briefs } = await fetchAndFilterBriefs(
          recentBrief,
          fetchRecentAll
        );
        if (changed) {
          setRecentBrief(briefs);
          updateRecent("play", briefs.map(({ cid }) => cid).reverse());
        }
      }
    })();
  }, [recentBrief, fetchRecentAll]);
  useEffect(() => {
    void (async () => {
      if (latestBrief) {
        const { changed, briefs } = await fetchAndFilterBriefs(
          latestBrief,
          fetchLatestAll
        );
        if (changed) {
          setLatestBrief(briefs);
        }
      }
    })();
  }, [latestBrief, fetchLatestAll]);
  useEffect(() => {
    void (async () => {
      if (originalBrief) {
        const { changed, briefs } = await fetchAndFilterBriefs(
          originalBrief,
          fetchOriginalAll
        );
        if (changed) {
          setOriginalBrief(briefs);
        }
      }
    })();
  }, [originalBrief, fetchOriginalAll]);
  useEffect(() => {
    void (async () => {
      if (sampleBrief) {
        const { changed, briefs } = await fetchAndFilterBriefs(
          sampleBrief,
          fetchSampleAll
        );
        if (changed) {
          setSampleBrief(briefs);
        }
      }
    })();
  }, [sampleBrief, fetchSampleAll]);

  const [cidErrorMsg, setCIdErrorMsg] = useState<string>("");
  const [cidFetching, setCidFetching] = useState<boolean>(false);
  const gotoCId = async (cid: string) => {
    setCIdErrorMsg("");
    setCidFetching(true);
    const res = await fetchBrief(cid, true);
    if (res.ok) {
      // router.push(`/share/${cid}`);
      openModal(cid, res.brief);
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
    <IndexMain
      tab={1}
      locale={locale}
      modal={
        modalCId &&
        modalBrief && (
          <div
            className={
              modalBg +
              "transition-opacity duration-200 " +
              (modalAppearing ? "ease-in opacity-100 " : "ease-out opacity-0 ")
            }
            onClick={() => window.history.back()}
          >
            <div className="absolute inset-6">
              <Box
                onClick={(e) => e.stopPropagation()}
                className={
                  "absolute inset-0 m-auto w-max h-max max-w-full max-h-full " +
                  "p-6 overflow-x-clip overflow-y-auto " +
                  "shadow-lg " +
                  "transition-transform duration-200 origin-center " +
                  (modalAppearing ? "ease-in scale-100 " : "ease-out scale-0 ")
                }
              >
                <ShareBox
                  cid={modalCId}
                  brief={modalBrief}
                  locale={locale}
                  backButton={() => window.history.back()}
                />
              </Box>
            </div>
          </div>
        )
      }
    >
      <AccordionLike
        hidden={showExclusiveMode !== null}
        header={
          <>
            <span className="text-xl font-bold font-title">
              {t("inputId")}:
            </span>
            <Input
              className="ml-4 w-20"
              actualValue=""
              updateValue={gotoCId}
              isValid={validCId}
              left
            />
            <span className={cidFetching ? "inline-block " : "hidden "}>
              <LoadingSlime />
              Loading...
            </span>
            <span className="ml-1 inline-block">{cidErrorMsg}</span>
          </>
        }
      >
        <p className="pl-2 text-justify">{t("inputIdDesc")}</p>
        <p className="pl-2 text-justify">
          {t.rich("inputIdDesc2", {
            url: () => <SmallDomainShare />,
          })}
        </p>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-3 ml-2">
            <h4 className="mb-1 ">
              <span className="text-lg font-bold font-title">
                {t("inputDirect")}:
              </span>
              <Input
                className="ml-4 w-20"
                actualValue=""
                updateValue={(cid) =>
                  window
                    .open(`/${locale}/play?cid=${cid}&lvIndex=0`, "_blank")
                    ?.focus()
                }
                isValid={validCId}
                left
              />
            </h4>
            <p className="pl-2 text-justify text-sm ">
              ({t("inputDirectDevonly")})
            </p>
          </div>
        )}
      </AccordionLike>
      <AccordionLike
        hidden={showExclusiveMode !== null && showExclusiveMode !== "recent"}
        expanded={showAllMode === "recent"}
        reset={() => window.history.back()}
        header={
          <span className="text-xl font-bold font-title">
            {t("recentPlay")}
          </span>
        }
      >
        <ChartList
          recentBrief={recentBrief}
          maxRow={chartListMaxRow}
          fetchAdditional={() => setFetchRecentAll(true)}
          creator
          href={(cid) => `/share/${cid}`}
          onClick={(cid) =>
            openModal(cid, recentBrief?.find((b) => b.cid === cid)?.brief)
          }
          showLoading
          additionalOpen={showAllMode === "recent"}
          setAdditionalOpen={(open) => {
            if (open) {
              goExclusiveMode("recent");
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
          onClick={(cid) =>
            openModal(cid, latestBrief?.find((b) => b.cid === cid)?.brief)
          }
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
                .find((b) => b.cid === cid)?.brief
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
