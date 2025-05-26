"use client";

import { IndexMain } from "../main.js";
import { ChartList } from "../chartList.js";
import { ExternalLink } from "@/common/extLink.js";
import Youtube from "@icon-park/react/lib/icons/Youtube";
import { numLatest, popularDays } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { useShareModal } from "../shareModal.jsx";
import { ChartLineBrief } from "../fetch.js";
import Input from "@/common/input.jsx";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { titleWithSiteName } from "@/common/title.js";

interface Props {
  locale: string;
  sampleBriefs: ChartLineBrief[];
  originalBriefs: ChartLineBrief[];
}
export default function PlayTab(props: Props) {
  const t = useTranslations("main.play");
  const { locale } = props;

  const { modal, openModal, openShareInternal } = useShareModal(
    locale,
    "play",
    { noResetTitle: true }
  );

  const [searchText, setSearchText_] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);
  const abortSearching = useRef<AbortController | null>(null);
  const searchingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchResult, setSearchResult] = useState<
    ChartLineBrief[] | { status: number | null; message: string } | undefined
  >();
  const [searchMaxRow, setSearchMaxRow] = useState<number>(numLatest);
  const setSearchText = useCallback(
    (v: string, noDelay?: boolean) => {
      setSearchText_(v);
      setSearchMaxRow(numLatest);
      if (abortSearching.current) {
        abortSearching.current.abort();
        abortSearching.current = null;
      }
      if (searchingTimeout.current) {
        clearTimeout(searchingTimeout.current);
        searchingTimeout.current = null;
      }
      if (!v) {
        if (window.location.search.length > 2) {
          window.history.back();
        }
        setSearching(false);
        setSearchResult(undefined);
        document.title = titleWithSiteName(t("title"));
      } else {
        if (window.location.search.length < 2) {
          window.history.pushState(null, "", `?search=${v}`);
        } else {
          window.history.replaceState(null, "", `?search=${v}`);
        }
        setSearching(true);
        setSearchResult(undefined);
        document.title = titleWithSiteName(t("searchTitle", { search: v }));
        abortSearching.current = new AbortController();
        searchingTimeout.current = setTimeout(
          () => {
            searchingTimeout.current = null;
            if (abortSearching.current) {
              fetch(process.env.BACKEND_PREFIX + `/api/search?q=${v}`, {
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
                    setSearching(false);
                  } else {
                    try {
                      setSearchResult({
                        status: res.status,
                        message: (await res.json()).message,
                      });
                    } catch {
                      setSearchResult({ status: res.status, message: "" });
                    }
                    setSearching(false);
                  }
                })
                .catch((e) => {
                  console.error(e);
                  setSearchResult({ status: null, message: "fetchError" });
                  setSearching(false);
                });
            }
          },
          noDelay ? 0 : 1000
        );
      }
    },
    [t]
  );

  useEffect(() => {
    const handler = () => {
      if (window.location.pathname.includes("/main/play")) {
        const q = new URLSearchParams(window.location.search).get("search");
        if (q) {
          setSearchText(q, true);
        } else {
          setSearchText("");
        }
      }
    };
    handler();
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [setSearchText]);

  return (
    <IndexMain
      title={t("title")}
      tabKey="play"
      mobileTabKey="play"
      noBackButtonMobile
      noBackButtonPC
      locale={locale}
      modal={modal}
    >
      <div className="flex-none mb-3 ">
        <h3 className="mb-2 flex items-baseline ">
          <span className="mr-2 text-xl font-bold font-title ">
            {t("search")}:
          </span>
          <Input
            actualValue={searchText}
            updateValue={setSearchText}
            left
            className="flex-1 font-title "
          />
        </h3>
        <p className="pl-2 mb-1 text-justify ">{t("searchDesc")}</p>
        {(searchResult || searching) && (
          <ChartList
            briefs={searchResult}
            search
            creator
            href={(cid) => `/share/${cid}`}
            onClick={openModal}
            onClickMobile={openShareInternal}
            showLoading
            maxRow={Math.min(
              searchMaxRow,
              Array.isArray(searchResult) ? searchResult.length : 0
            )}
            onMoreClick={() => setSearchMaxRow((prev) => prev + numLatest)}
            badge
          />
        )}
      </div>
      <AccordionLike
        className="flex-none mb-3 "
        hidden={searching || !!searchResult}
      >
        <h3 className="mb-2 text-xl font-bold font-title">{t("popular")}</h3>
        <p className="pl-2 mb-1 text-justify ">
          {t("popularDesc", { popularDays })}
        </p>
        <ChartList
          type="popular"
          creator
          href={(cid) => `/share/${cid}`}
          onClick={openModal}
          onClickMobile={openShareInternal}
          showLoading
          moreHref={`/${locale}/main/popular`}
          badge
        />
      </AccordionLike>
      <AccordionLike
        className="flex-none mb-3 "
        hidden={searching || !!searchResult}
      >
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
          onClickMobile={openShareInternal}
          showLoading
          dateDiff
          moreHref={`/${locale}/main/latest`}
          badge
        />
      </AccordionLike>
      <AccordionLike
        className="flex-none mb-3 "
        hidden={searching || !!searchResult}
      >
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
          briefs={props.originalBriefs}
          fetchAll
          href={(cid) => `/share/${cid}`}
          onClick={openModal}
          onClickMobile={openShareInternal}
          showLoading
          moreHref={null}
          badge
        />
        <ChartList
          briefs={props.sampleBriefs}
          fetchAll
          href={(cid) => `/share/${cid}`}
          onClick={openModal}
          onClickMobile={openShareInternal}
          showLoading
          moreHref={null}
          badge
        />
      </AccordionLike>
    </IndexMain>
  );
}

export function AccordionLike(props: {
  className?: string;
  hidden: boolean;
  // expanded?: boolean;
  children: ReactNode;
  // reset?: () => void;
}) {
  const [hidden, setHidden] = useState<boolean>(false);
  const [transparent, setTransparent] = useState<boolean>(false);
  useEffect(() => {
    if (props.hidden) {
      setTransparent(true);
      setTimeout(() => setHidden(true), 200);
    } else {
      setHidden(false);
      requestAnimationFrame(() => setTransparent(false));
    }
  }, [props.hidden]);

  return (
    <div
      className={
        // main-wide:
        "transition-all duration-500 " +
        (hidden ? "hidden " : "") +
        (transparent
          ? "m-0! ease-out opacity-0 max-h-0 pointer-events-none "
          : "ease-in opacity-100 max-h-200 ") +
        props.className
      }
    >
      {props.children}
    </div>
  );
}
