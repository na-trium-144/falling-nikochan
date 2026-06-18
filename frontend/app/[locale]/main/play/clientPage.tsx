"use client";

import clsx from "clsx/lite";
import { IndexMain } from "../main.js";
import { ChartList } from "../chartList.js";
import { ExternalLink } from "@/common/extLink.js";
import { CidSchema, maxLv, minLv, popularDays } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { ChartLineBrief } from "../chartList.js";
import Input from "@/common/input.jsx";
import {
  RefObject,
  useCallback,
  useRef,
  useState,
  Suspense,
  useMemo,
  useLayoutEffect,
  useEffect,
} from "react";
import { titleWithSiteName } from "@/common/title.js";
import { useSharePageModal } from "@/common/sharePageModal.jsx";
import { useResizeDetector } from "react-resize-detector";
import { useDisplayMode } from "@/scale.jsx";
import { XLogo } from "@/common/x.jsx";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation.js";
import { ButtonHighlight } from "@/common/button.js";
import { Range2 } from "@/common/range.js";
import { getRecent, recentKey } from "@/common/recent.js";
import Search from "@icon-park/react/lib/icons/Search";
import { captureAndWrap, fetchBackend } from "@/common/fetch.js";
import * as v from "valibot";

// route/src/api/search.tsとあわせる
const MAX_CIDS_COUNT = 100;

interface Props {
  locale: string;
}

export default function PlayTab(props: Props) {
  return (
    <Suspense fallback={<PlayTabInternal {...props} />}>
      <PlayTabWithParams {...props} />
    </Suspense>
  );
}

function PlayTabWithParams(props: Props) {
  const searchParams = useSearchParams();
  return <PlayTabInternal {...props} searchParams={searchParams} />;
}

function PlayTabInternal(
  props: Props & { searchParams?: ReturnType<typeof useSearchParams> }
) {
  const t = useTranslations("main.play");
  const { locale } = props;

  // 基本的には現在のlocationのクエリパラメーター(props.searchParamsで得られる)を真とするが、
  // URLが/shareの場合のみそれを使用できないので、stateにもコピーを保存しておく
  // /shareの間にfetchした検索結果を反映するため、shareから戻る瞬間にもこのstateを参照してhistoryを修正する
  const [fallbackSearchParams, setFallbackSearchParams] =
    useState<URLSearchParams>(new URLSearchParams());
  let searchParams: ReadonlyURLSearchParams | URLSearchParams | undefined =
    props.searchParams;
  const prevPathName = useRef<string>("");
  if (typeof window !== "undefined") {
    if (window.location.pathname.includes("/share")) {
      searchParams = fallbackSearchParams;
    } else {
      if (
        window.location.search &&
        window.location.search !== "?" + fallbackSearchParams?.toString()
      ) {
        if (prevPathName.current.includes("/share")) {
          searchParams = fallbackSearchParams;
          window.history.replaceState(
            null,
            "",
            `?${fallbackSearchParams.toString()}`
          );
        } else {
          setFallbackSearchParams(new URLSearchParams(window.location.search));
        }
      }
    }
    prevPathName.current = window.location.pathname;
  }

  const { openModal, openShareInternal } = useSharePageModal();

  // ユーザーが文字を入力してから実際にAPIを呼び出すまでの間loading表示にする
  const [waitingDebounce, setWaitingDebounce] = useState(false);

  interface PageParams {
    search: string;
    sort: "relevance" | "latest" | "popular" | "recent" | undefined;
    minLv: number;
    maxLv: number;
  }
  interface APIParams {
    q: string;
    sort?: "relevance" | "latest" | "popular";
    c?: string[];
    difficultyMin: string;
    difficultyMax: string;
  }
  const prevParam = useRef<PageParams>(null);
  const params = useMemo(() => {
    if (!searchParams) {
      // SSR時・初期化前
      return {
        search: "",
        sort: undefined, // 最初はどれも選択していない状態でレンダリングする
        minLv: minLv,
        maxLv: maxLv,
      };
    } else {
      const params: PageParams = {
        search: searchParams.get("search") || "",
        sort:
          (searchParams.get("sort") as
            | "relevance"
            | "latest"
            | "popular"
            | "recent") || "relevance",
        minLv: Number(searchParams.get("minLv") ?? minLv),
        maxLv: Number(searchParams.get("maxLv") ?? maxLv),
      };
      if (params && !params.search && params.sort === "relevance") {
        params.sort = "latest";
      }
      prevParam.current = params;
      return params;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (props.searchParams?.get("focus") === "search") {
      searchRef.current?.focus();
    }
  }, [props.searchParams]);
  const updateParams = useCallback(
    (params: Partial<PageParams>) => {
      const newParams = new URLSearchParams(props.searchParams);
      newParams.delete("focus");
      if (params.search !== undefined) {
        if (params.search) {
          newParams.set("search", params.search);
        } else {
          newParams.delete("search");
        }
      }
      if (params.sort !== undefined) {
        newParams.set("sort", params.sort);
      }
      if (params.minLv !== undefined) {
        newParams.set("minLv", String(params.minLv));
      }
      if (params.maxLv !== undefined) {
        newParams.set("maxLv", String(params.maxLv));
      }
      if (!window.location.pathname.includes("/share")) {
        window.history.replaceState(null, "", `?${newParams.toString()}`);
      }
      setFallbackSearchParams(newParams);
      // useEffectでAPIを呼び出すときにwaitingDebounceをfalseにするが、
      // paramsに変化がなかったときなどuseEffectが呼び出されない可能性もあるので、
      // そのfallback
      setTimeout(() => {
        setWaitingDebounce(false);
      }, 250);
    },
    [props.searchParams]
  );

  // [] = not found, empty = empty
  const [searchResult, setSearchResult] = useState<
    ChartLineBrief[] | Error | "loading" | "empty"
  >("loading");

  useLayoutEffect(() => {
    if (!params.sort) {
      return;
    }
    setWaitingDebounce(false);
    setSearchResult("loading");
    let aborted = false;
    const doSearch = () => {
      const apiBaseParams = {
        q: params.search,
        difficultyMin: String(params.minLv),
        difficultyMax: String(params.maxLv),
      };
      const recent = getRecent("play").reverse();
      // recentの場合、cidが100件を超えると複数リクエストになる
      const apiSortParams =
        params.sort === "recent"
          ? Array.from(
              new Array(Math.ceil(recent.length / MAX_CIDS_COUNT))
            ).map((_, i) => ({
              c: recent.slice(i * MAX_CIDS_COUNT, (i + 1) * MAX_CIDS_COUNT),
            }))
          : [{ sort: params.sort ?? "relevance" }];
      if (!params.search) {
        document.title = titleWithSiteName(t("title"));
      } else {
        document.title = titleWithSiteName(
          t("searchTitle", { search: params.search })
        );
      }
      if (apiSortParams.length === 0) {
        setSearchResult("empty");
      } else {
        let searchResultChunks: ChartLineBrief[][] = [];
        let firstError: Error | null = null;
        apiSortParams.forEach((apiSortParam, i) => {
          searchResultChunks.push([]);
          fetchBackend()
            .url(`/api/search`)
            .query({ ...apiBaseParams, ...apiSortParam } satisfies APIParams)
            .get()
            .json((res) =>
              v
                .parse(
                  v.array(
                    v.object({
                      cid: v.string(),
                      count: v.optional(v.number()),
                      updatedAt: v.optional(v.number()),
                    })
                  ),
                  res
                )
                .map((r) => ({
                  cid: r.cid,
                  updatedAt: r.updatedAt,
                  fetched: false,
                }))
            )
            .catch((e: unknown) => captureAndWrap(e))
            .then((res) => {
              if (aborted) {
                return; // ignore
              }
              if (Array.isArray(res)) {
                searchResultChunks[i] = res;
              } else if (res instanceof Error && !firstError) {
                firstError = res;
              }
              setSearchResult(
                firstError ? firstError : searchResultChunks.flat(1)
              );
            });
        });
      }
    };
    doSearch();
    const storageUpdate = (e: StorageEvent) => {
      if (e.key === recentKey("play")) {
        doSearch();
      }
    };
    if (params.sort === "recent") {
      // recentは別タブで更新される場合があり、そのとき再検索する
      window.addEventListener("storage", storageUpdate);
      window.addEventListener("visibilitychange", doSearch); // 別タブからもどってきたとき
      window.addEventListener("popstate", doSearch); // router.push()からもどってきたとき
    }
    return () => {
      window.removeEventListener("storage", storageUpdate);
      window.removeEventListener("visibilitychange", doSearch);
      window.removeEventListener("popstate", doSearch);
      aborted = true;
    };
  }, [t, params.search, params.sort, params.maxLv, params.minLv]);

  const boxSize = useResizeDetector();
  const { rem } = useDisplayMode();

  const [minLvCurrent, setMinLvCurrent] = useState(params.minLv);
  const [maxLvCurrent, setMaxLvCurrent] = useState(params.maxLv);
  const [difficultyDebounceTimer, setDifficultyDebounceTimer] =
    useState<ReturnType<typeof setTimeout> | null>(null);
  if (difficultyDebounceTimer === null) {
    if (minLvCurrent !== params.minLv) {
      setMinLvCurrent(params.minLv);
    }
    if (maxLvCurrent !== params.maxLv) {
      setMaxLvCurrent(params.maxLv);
    }
  } else {
    if (minLvCurrent === params.minLv && maxLvCurrent === params.maxLv) {
      clearTimeout(difficultyDebounceTimer);
      setDifficultyDebounceTimer(null);
      setWaitingDebounce(false);
    }
  }

  const { isMobileMain } = useDisplayMode();
  const gotoCId = (cid: string) => {
    fetchBackend()
      .get(`/api/brief/${cid}`)
      .notFound(() => undefined)
      .res(() => {
        if (isMobileMain) {
          openShareInternal(cid);
        } else {
          openModal(cid);
        }
      });
  };

  return (
    <IndexMain
      title={t("title")}
      tabKey="play"
      mobileTabKey="play"
      noBackButtonMobile
      noBackButtonPC
      locale={locale}
      boxRef={boxSize.ref as RefObject<HTMLDivElement | null>}
    >
      <section className="fn-sect relative">
        <p>
          {t("description")}
          {t.rich("descriptionX", {
            xlogo: () => <XLogo />,
            twitter: (c) => (
              <ExternalLink className="" href="https://twitter.com/nikochan144">
                <span className="text-sm">{c}</span>
              </ExternalLink>
            ),
          })}
        </p>
        <p className="text-sm">({t("descriptionPublic")})</p>
        <a
          href={process.env.BACKEND_PREFIX + "/rss.xml"}
          target="_blank"
          className="block absolute right-0 bottom-0 fn-rss-button"
        />
      </section>
      <section className="fn-sect">
        <ul className="list-disc ml-6 space-y-2 text-left">
          <li>
            <div className="flex items-baseline">
              <span className="mr-2 flex-none">{t("search")}:</span>
              <Search className="text-lg self-center" />
              <Input
                ref={searchRef}
                actualValue={params.search}
                updateValue={(v) => updateParams({ search: v })}
                updateDebounce={1000}
                onChange={(val) => {
                  setWaitingDebounce(true);
                  if (v.safeParse(CidSchema(), val).success) {
                    gotoCId(val);
                  }
                }}
                left
                className="flex-1 font-title min-w-0"
                placeholder={t("searchPlaceholder")}
              />
            </div>
          </li>
          <li>
            <div className="flex flex-wrap items-center">
              <span className="mr-2">{t("sort")}:</span>
              <span
                className={clsx(
                  "inline-grid max-w-full text-nowrap",
                  "grid-cols-1 w-full",
                  "min-[18rem]:grid-cols-2 min-[18rem]:w-max min-[36rem]:grid-cols-4"
                )}
              >
                {(["relevance", "latest", "popular", "recent"] as const).map(
                  (sort) => (
                    <button
                      key={sort}
                      className={clsx(
                        "fn-toggle",
                        sort === params.sort
                          ? "fn-flat-button fn-plain fn-selected"
                          : "fn-flat-button fn-sky"
                      )}
                      onClick={() => updateParams({ sort })}
                      disabled={sort === "relevance" && !params.search}
                    >
                      <span className="fn-glass-1" />
                      <span className="fn-glass-2" />
                      <ButtonHighlight />
                      {t(sort)}
                    </button>
                  )
                )}
              </span>
            </div>
            <p className="ml-2 mt-1">
              {params.sort === "popular" && t("popularDesc", { popularDays })}
              {
                params.sort === "latest" && t("latestDesc")
                // <span className="text-sm ">(最新の{numLatest}件まで)</span>
              }
            </p>
          </li>
          <li>
            <div className="flex items-center">
              <span className="flex-none mr-2">{t("level")}:</span>
              <span className="w-6 text-center">{minLvCurrent}</span>
              <Range2
                className="shrink-1 basis-80 mx-4"
                min={minLv}
                max={maxLv}
                value1={minLvCurrent}
                value2={maxLvCurrent}
                onChange={(min, max) => {
                  setMinLvCurrent(min);
                  setMaxLvCurrent(max);
                  setWaitingDebounce(true);
                  if (difficultyDebounceTimer !== null) {
                    clearTimeout(difficultyDebounceTimer);
                  }
                  setDifficultyDebounceTimer(
                    setTimeout(() => {
                      updateParams({ minLv: min, maxLv: max });
                    }, 250)
                  );
                }}
              />
              <span className="w-6 text-center">{maxLvCurrent}</span>
            </div>
          </li>
        </ul>
      </section>
      <ChartList
        briefs={waitingDebounce ? undefined : searchResult}
        search
        creator
        href={(cid) => `/share/${cid}`}
        onClick={openModal}
        onClickMobile={openShareInternal}
        showLoading
        badge
        dateDiff={params.sort === "latest"}
        containerRef={boxSize.ref as RefObject<HTMLDivElement | null>}
        containerHeight={
          boxSize.height ? boxSize.height - (12 / 4) * rem : undefined
        }
      />
    </IndexMain>
  );
}
