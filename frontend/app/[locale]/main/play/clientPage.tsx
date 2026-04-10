"use client";

import clsx from "clsx/lite";
import { IndexMain } from "../main.js";
import { ChartList } from "../chartList.js";
import { ExternalLink } from "@/common/extLink.js";
import { maxLv, minLv, popularDays } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { ChartLineBrief } from "../chartList.js";
import Input from "@/common/input.jsx";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { titleWithSiteName } from "@/common/title.js";
import { useSharePageModal } from "@/common/sharePageModal.jsx";
import { useResizeDetector } from "react-resize-detector";
import { useDisplayMode } from "@/scale.jsx";
import { XLogo } from "@/common/x.jsx";
import { APIError } from "@/common/apiError.js";
import { useRouter, useSearchParams } from "next/navigation.js";
import { ButtonHighlight } from "@/common/button.js";
import { Range2 } from "@/common/range.js";

interface Props {
  locale: string;
}
export default function PlayTab(props: Props) {
  const t = useTranslations("main.play");
  const { locale } = props;

  const { openModal, openShareInternal } = useSharePageModal();

  // ユーザーが文字を入力してから実際にAPIを呼び出すまでの間loading表示にする
  const [waitingDebounce, setWaitingDebounce] = useState(false);

  const pageParams = useSearchParams();
  const router = useRouter();

  interface PageParams {
    search: string;
    sort: "relevance" | "latest" | "popular";
    minLv: number;
    maxLv: number;
  }
  const params: PageParams = {
    search: pageParams.get("search") || "",
    sort:
      (pageParams.get("sort") as "relevance" | "latest" | "popular") ||
      "relevance",
    minLv: Number(pageParams.get("minLv") || minLv),
    maxLv: Number(pageParams.get("maxLv") || maxLv),
  };
  if (!params.search && params.sort === "relevance") {
    params.sort = "latest";
  }
  const updateParams = useCallback(
    (params: Partial<PageParams>) => {
      const newParams = new URLSearchParams(pageParams);
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
      router.replace(`?${newParams.toString()}`);
      // useEffectでAPIを呼び出すときにwaitingDebounceをfalseにするが、
      // paramsに変化がなかったときなどuseEffectが呼び出されない可能性もあるので、
      // そのfallback
      setTimeout(() => {
        setWaitingDebounce(false);
      }, 250);
    },
    [pageParams, router]
  );

  const abortSearching = useRef<AbortController | null>(null);
  const [searchResult, setSearchResult] = useState<
    ChartLineBrief[] | APIError | undefined
  >();

  useEffect(() => {
    if (abortSearching.current) {
      abortSearching.current.abort();
      abortSearching.current = null;
    }
    setWaitingDebounce(false);
    setSearchResult(undefined);
    const apiParams = new URLSearchParams({
      q: params.search,
      sort: params.sort,
      difficultyMin: String(params.minLv),
      difficultyMax: String(params.maxLv),
    });
    if (!params.search) {
      document.title = titleWithSiteName(t("title"));
    } else {
      document.title = titleWithSiteName(
        t("searchTitle", { search: params.search })
      );
    }
    abortSearching.current = new AbortController();
    fetch(process.env.BACKEND_PREFIX + `/api/search?${apiParams.toString()}`, {
      signal: abortSearching.current.signal,
    })
      .then(async (res) => {
        if (res.ok) {
          setSearchResult(
            (await res.json()).map((r: { cid: string }) => ({
              cid: r.cid,
              fetched: false,
            }))
          );
        } else {
          setSearchResult(await APIError.fromRes(res));
        }
      })
      .catch((e) => {
        console.error(e);
        setSearchResult(APIError.fetchError());
      });
  }, [
    t,
    params.search,
    params.sort,
    params.maxLv,
    params.minLv,
  ]);

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
    if (
      minLvCurrent === params.minLv &&
      maxLvCurrent === params.maxLv
    ) {
      clearTimeout(difficultyDebounceTimer);
      setDifficultyDebounceTimer(null);
      setWaitingDebounce(false);
    }
  }

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
          rel="noopener noreferrer"
          className="block absolute right-0 bottom-0 fn-rss-button"
        />
      </section>
      <section className="fn-sect">
        <ul className="list-disc ml-6 space-y-1 text-left">
          <li>
            <div className="flex items-baseline">
              <span className="mr-2">{t("search")}:</span>
              <Input
                actualValue={params.search}
                updateValue={(v) => updateParams({ search: v })}
                updateDebounce={1000}
                onChange={() => setWaitingDebounce(true)}
                left
                className="flex-1 font-title "
                placeholder={t("searchPlaceholder")}
              />
            </div>
          </li>
          <li>
            <div>
              <span className="mr-2">{t("sort")}:</span>
              <span className="inline-grid grid-cols-3 w-max ">
                {(["relevance", "latest", "popular"] as const).map((sort) => (
                  <button
                    key={sort}
                    className={clsx(
                      "fg-bright",
                      "rounded-lg px-3 py-1 my-0.5",
                      sort === params.sort
                        ? "fn-flat-button fn-plain fn-selected"
                        : "fn-flat-button fn-sky",
                      sort === params.sort
                        ? "shadow-2xs"
                        : "hover:not-disabled:shadow-2xs",
                      "shadow-slate-500/50 dark:shadow-stone-950/50",
                      "disabled:text-dim"
                    )}
                    onClick={() => updateParams({ sort })}
                    disabled={sort === "relevance" && !params.search}
                  >
                    <span className="fn-glass-1" />
                    <span className="fn-glass-2" />
                    <ButtonHighlight />
                    {t(sort)}
                  </button>
                ))}
              </span>
            </div>
            <p className="ml-2">
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
                    }, 1000)
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
        containerRef={boxSize.ref as RefObject<HTMLDivElement | null>}
        containerHeight={
          boxSize.height ? boxSize.height - (12 / 4) * rem : undefined
        }
      />
    </IndexMain>
  );
}
