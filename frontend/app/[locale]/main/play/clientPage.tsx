"use client";

import clsx from "clsx/lite";
import { IndexMain } from "../main.js";
import { ChartList } from "../chartList.js";
import { ExternalLink } from "@/common/extLink.js";
import Youtube from "@icon-park/react/lib/icons/Youtube";
import { popularDays } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { ChartLineBrief } from "../chartList.js";
import Input from "@/common/input.jsx";
import {
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { titleWithSiteName } from "@/common/title.js";
import { useSharePageModal } from "@/common/sharePageModal.jsx";
import { useDelayedDisplayState } from "@/common/delayedDisplayState.js";
import { useResizeDetector } from "react-resize-detector";
import { useDisplayMode } from "@/scale.jsx";
import { XLogo } from "@/common/x.jsx";

interface Props {
  locale: string;
  sampleBriefs: ChartLineBrief[];
  originalBriefs: ChartLineBrief[];
}
export default function PlayTab(props: Props) {
  const t = useTranslations("main.play");
  const { locale } = props;

  const { openModal, openShareInternal } = useSharePageModal();

  const [searchText, setSearchText_] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);
  const abortSearching = useRef<AbortController | null>(null);
  const searchingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchResult, setSearchResult] = useState<
    ChartLineBrief[] | { status: number | null; message: string } | undefined
  >();
  const setSearchText = useCallback(
    (v: string, noDelay?: boolean) => {
      setSearchText_(v);
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

  const boxSize = useResizeDetector();
  const { rem } = useDisplayMode();

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
      <section className="fn-sect">
        <h3 className="flex items-baseline">
          <span className="mr-2 fn-heading-sect">{t("search")}:</span>
          <Input
            actualValue={searchText}
            updateValue={setSearchText}
            left
            className="flex-1 font-title "
          />
        </h3>
        <p className="mb-1">{t("searchDesc")}</p>
        {(searchResult || searching) && (
          <ChartList
            briefs={searchResult}
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
        )}
      </section>
      <AccordionLike className="fn-sect" hidden={searching || !!searchResult}>
        <h3 className="fn-heading-sect">{t("popular")}</h3>
        <p className="mb-1">{t("popularDesc", { popularDays })}</p>
        <ChartList
          type="popular"
          creator
          href={(cid) => `/share/${cid}`}
          onClick={openModal}
          onClickMobile={openShareInternal}
          showLoading
          moreHref={`/${locale}/main/popular`}
          badge
          fixedRows
        />
      </AccordionLike>
      <AccordionLike className="fn-sect" hidden={searching || !!searchResult}>
        <h3 className="fn-heading-sect">{t("latest")}</h3>
        <p>
          {t.rich("latestDesc", {
            xlogo: () => <XLogo />,
            twitter: (c) => (
              <ExternalLink className="" href="https://twitter.com/nikochan144">
                <span className="text-sm">{c}</span>
              </ExternalLink>
            ),
          })}
          {/*<span className="text-sm ">(最新の{numLatest}件まで)</span>*/}
        </p>
        <p className="mb-1 text-sm ">({t("latestDesc2")})</p>
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
          fixedRows
        />
      </AccordionLike>
      <AccordionLike className="fn-sect" hidden={searching || !!searchResult}>
        <h3 className="fn-heading-sect">{t("sample")}</h3>
        <p className="mb-1">
          {t.rich("sampleDesc", {
            small: (c) => <span className="text-sm mx-0.5">{c}</span>,
          })}
          {t.rich("sampleDesc2", {
            youtube: (c) => (
              <ExternalLink
                className="mx-1"
                href="https://www.youtube.com/@nikochan144"
              >
                <Youtube
                  className="inline-block mr-1 align-middle"
                  theme="filled"
                />
                <span className="text-sm">{c}</span>
              </ExternalLink>
            ),
          })}
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="mb-1 text-sm">({t("sampleDevonly")})</p>
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
  const [opened, anim, setOpened] = useDelayedDisplayState(200, {
    initial: !props.hidden,
  });
  useEffect(() => {
    setOpened(!props.hidden);
  }, [props.hidden, setOpened]);

  return (
    <div
      className={clsx(
        props.className,
        // main-wide:
        "transition-all duration-500",
        !opened && "hidden",
        !anim
          ? "m-0! ease-out opacity-0 max-h-0 pointer-events-none"
          : "ease-in opacity-100 max-h-200"
      )}
    >
      {props.children}
    </div>
  );
}
