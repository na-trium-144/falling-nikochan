"use client";

import {
  ChartLineBrief,
  chartListMaxRow,
  fetchAndFilterBriefs,
} from "./fetch.js";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRecent, updateRecent } from "@/common/recent.js";
import { IndexMain } from "../main.js";
import Input from "@/common/input.js";
import { LoadingSlime } from "@/common/loadingSlime.js";
import { AccordionLike, ChartList } from "../chartList.js";
import { ExternalLink } from "@/common/extLink.js";
import { Youtube } from "@icon-park/react";
import {
  originalCId,
  sampleCId,
  validCId,
} from "@/../../chartFormat/apiConfig.js";
import { useTranslations } from "next-intl";
import { SmallDomainShare } from "@/common/small";
import { useDisplayMode } from "@/scale.js";

export default function PlayTab({ locale }: { locale: string }) {
  const t = useTranslations("main.play");
  const { isMobileMain } = useDisplayMode();

  const [recentBrief, setRecentBrief] = useState<ChartLineBrief[]>();
  const [fetchRecentAll, setFetchRecentAll] = useState<boolean>(false);
  const [latestBrief, setLatestBrief] = useState<ChartLineBrief[]>();
  const [fetchLatestAll, setFetchLatestAll] = useState<boolean>(false);
  const [originalBrief, setOriginalBrief] = useState<ChartLineBrief[]>();
  const fetchOriginalAll = true;
  const [sampleBrief, setSampleBrief] = useState<ChartLineBrief[]>();
  const fetchSampleAll = true;
  const router = useRouter();

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
    const res = await fetch(process.env.BACKEND_PREFIX + `/api/brief/${cid}`, {
      cache: "no-store",
    });
    if (res.ok) {
      router.push(`/share/${cid}`);
    } else {
      setCidFetching(false);
      try {
        setCIdErrorMsg(
          String(((await res.json()) as { message?: string }).message)
        );
      } catch (e) {
        setCIdErrorMsg(String(e));
      }
    }
  };

  // exclusiveをセット(指定したもの以外を非表示にする) → 200ms後、showAllをセット(指定したものの内容を全て表示する)
  // mobileではごちゃごちゃやってもスクロールが入るせいできれいに見えないので瞬時に切り替える
  const [showExclusiveMode, setShowExclusiveMode] = useState<
    null | "recent" | "latest"
  >(null);
  const [showAllMode, setShowAllMode] = useState<null | "recent" | "latest">(
    null
  );

  return (
    <IndexMain tab={1} locale={locale}>
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
        reset={() => {
          setShowAllMode(null);
          setShowExclusiveMode(null);
        }}
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
          showLoading
          additionalOpen={showAllMode === "recent"}
          setAdditionalOpen={(open) => {
            setShowExclusiveMode(open ? "recent" : null);
            if (isMobileMain) {
              setShowAllMode(open ? "recent" : null);
              window.scrollTo(0, 0);
            } else {
              setTimeout(() => setShowAllMode(open ? "recent" : null), 200);
            }
          }}
        />
      </AccordionLike>
      <AccordionLike
        hidden={showExclusiveMode !== null && showExclusiveMode !== "latest"}
        expanded={showAllMode === "latest"}
        reset={() => {
          setShowAllMode(null);
          setShowExclusiveMode(null);
        }}
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
          showLoading
          dateDiff
          additionalOpen={showAllMode === "latest"}
          setAdditionalOpen={(open) => {
            setShowExclusiveMode(open ? "latest" : null);
            if (isMobileMain) {
              setShowAllMode(open ? "latest" : null);
              window.scrollTo(0, 0);
            } else {
              setTimeout(() => setShowAllMode(open ? "latest" : null), 200);
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
          showLoading
          additionalOpen={false}
          setAdditionalOpen={() => undefined}
        />
      </AccordionLike>
    </IndexMain>
  );
}
