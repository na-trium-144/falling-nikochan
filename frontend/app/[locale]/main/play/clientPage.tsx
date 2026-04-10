"use client";

import clsx from "clsx/lite";
import { IndexMain } from "../main.js";
import { ChartList } from "../chartList.js";
import { ExternalLink } from "@/common/extLink.js";
import { popularDays } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { ChartLineBrief } from "../chartList.js";
import Input from "@/common/input.jsx";
import {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { titleWithSiteName } from "@/common/title.js";
import { useSharePageModal } from "@/common/sharePageModal.jsx";
import { useResizeDetector } from "react-resize-detector";
import { useDisplayMode } from "@/scale.jsx";
import { XLogo } from "@/common/x.jsx";
import { APIError } from "@/common/apiError.js";
import { useRouter, useSearchParams } from "next/navigation.js";

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
  }
  const params: PageParams = {
    search: pageParams.get("search") || "",
  };
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
  }, [t, params.search]);

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
            actualValue={params.search}
            updateValue={(v) => updateParams({ search: v })}
            updateDebounce={1000}
            onChange={() => setWaitingDebounce(true)}
            left
            className="flex-1 font-title "
          />
        </h3>
        <p className="mb-1">{t("searchDesc")}</p>
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
      </section>
      <h3 className="fn-heading-sect">{t("popular")}</h3>
      <p className="mb-1">{t("popularDesc", { popularDays })}</p>
      <h3 className="flex gap-2 items-center justify-between">
        <span className="fn-heading-sect">{t("latest")}</span>
        <a
          href={process.env.BACKEND_PREFIX + "/rss.xml"}
          target="_blank"
          rel="noopener noreferrer"
          className="fn-rss-button"
        />
      </h3>
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
    </IndexMain>
  );
}
