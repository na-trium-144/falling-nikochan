"use client";

import clsx from "clsx/lite";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChartBrief, CidSchema } from "@falling-nikochan/chart";
import * as v from "valibot";
import { SlimeSVG } from "../common/slime.jsx";
import { fetchBrief } from "../common/briefCache.js";
import { useSharePageModal } from "../common/sharePageModal.jsx";
import { ChartList } from "../main/chartList.jsx";
import { Box } from "../common/box.jsx";

interface Props {
  locale: string;
}

export default function NewTopPage(props: Props) {
  const t = useTranslations("main.newTopPage");
  const te = useTranslations("error");
  const ta = useTranslations("about");
  const router = useRouter();
  const { locale } = props;
  const { openModal, openShareInternal } = useSharePageModal();

  const [searchText, setSearchText] = useState<string>("");
  const [cidErrorMsg, setCidErrorMsg] = useState<string>("");
  const [cidFetching, setCidFetching] = useState<boolean>(false);

  const handleSearch = async (value: string, isMobile: boolean) => {
    setCidErrorMsg("");
    
    // Check if it's a valid chart ID
    if (v.safeParse(CidSchema(), value).success) {
      setCidFetching(true);
      const res = await fetchBrief(value, true);
      if (res.ok) {
        setCidErrorMsg("");
        if (isMobile) {
          openShareInternal(value, res.brief);
        } else {
          openModal(value, res.brief);
        }
      } else {
        if (res.is404) {
          setCidErrorMsg(te("api.chartIdNotFound"));
        } else {
          setCidErrorMsg(te("unknownApiError"));
        }
      }
      setCidFetching(false);
    } else {
      // Redirect to search page with query
      router.push(`/${locale}/main/play?search=${encodeURIComponent(value)}`);
    }
  };

  return (
    <main className="w-full h-full overflow-x-clip overflow-y-auto bg-gradient-to-b from-sky-100 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Video Placeholder Background */}
        <div className="absolute inset-0 -z-10 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 animate-pulse">
            <figure
              className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600"
              role="img"
              aria-label={t("videoPlaceholder")}
            >
              <p className="text-2xl font-bold opacity-50">{t("videoPlaceholder")}</p>
            </figure>
          </div>
        </div>

        {/* Large Centered Title */}
        <div className="text-center mb-8 z-10">
          <h1 className="text-6xl md:text-8xl font-bold font-title mb-4 drop-shadow-lg">
            Falling Nikochan
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8">
            {t("whatIsDesc")}
          </p>
        </div>

        {/* Primary CTA Button */}
        <Link
          href={`/${locale}/main/play`}
          className={clsx(
            "inline-block px-12 py-6 text-2xl font-bold rounded-full",
            "bg-gradient-to-r from-blue-500 to-purple-500",
            "text-white shadow-2xl",
            "hover:from-blue-600 hover:to-purple-600",
            "transform hover:scale-105 transition-all duration-200",
            "mb-8"
          )}
        >
          {t("playNow")}
        </Link>

        {/* Search Bar */}
        <div className="w-full max-w-2xl mb-8">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-full shadow-lg px-6 py-4">
            <input
              type="text"
              className="flex-1 font-title text-lg border-none bg-transparent outline-none text-gray-800 dark:text-gray-200"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchText) {
                  handleSearch(searchText, false);
                }
              }}
              placeholder={t("searchPlaceholder")}
            />
            {cidFetching && (
              <span className="flex items-center gap-2">
                <SlimeSVG />
                <span>{t("loading")}</span>
              </span>
            )}
          </div>
          {cidErrorMsg && (
            <p className="text-red-500 text-center mt-2">{cidErrorMsg}</p>
          )}
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              {t("communityStats")}
            </p>
            <div className="text-4xl font-bold text-blue-500 mb-1">
              1,000,000+
            </div>
            <p className="text-gray-600 dark:text-gray-400">{t("totalPlays")}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {t("illustrativeNote")}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              {t("communityStats")}
            </p>
            <div className="text-4xl font-bold text-purple-500 mb-1">
              10,000+
            </div>
            <p className="text-gray-600 dark:text-gray-400">{t("totalCharts")}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {t("illustrativeNote")}
            </p>
          </div>
        </div>
      </section>

      {/* Popular Charts Showcase */}
      <section className="px-6 py-16 bg-white dark:bg-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold font-title text-center mb-12">
            {t("popularCharts")}
          </h2>
          <ChartList
            type="popular"
            creator
            href={(cid) => `/share/${cid}`}
            onClick={openModal}
            onClickMobile={openShareInternal}
            showLoading
            badge
            fixedRows
          />
          <div className="text-center mt-8">
            <Link
              href={`/${locale}/main/play`}
              className={clsx(
                "inline-block px-8 py-3 text-lg font-semibold rounded-full",
                "bg-blue-500 text-white",
                "hover:bg-blue-600 transition-colors duration-200"
              )}
            >
              {t("playNow")}
            </Link>
          </div>
        </div>
      </section>

      {/* Recently Played Charts */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold font-title text-center mb-12">
            {t("recentCharts")}
          </h2>
          <ChartList
            type="recent"
            creator
            href={(cid) => `/share/${cid}`}
            onClick={openModal}
            onClickMobile={openShareInternal}
            showLoading
            moreHref={`/${locale}/main/recent`}
            badge
            fixedRows
          />
        </div>
      </section>

      {/* How to Play Section */}
      <section className="px-6 py-16 bg-gradient-to-b from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold font-title text-center mb-12">
            {t("howToPlay")}
          </h2>
          <Box classNameOuter="mb-8" padding={6}>
            <div className="space-y-4 text-lg">
              <p>{ta("1.content1")}</p>
              <p>{ta("1.content2")}</p>
              <p>{ta("2.content1")}</p>
              <p>{ta("2.description")}</p>
              <p>{ta("2.content3")}</p>
              <p>{ta("2.content4")}</p>
            </div>
          </Box>
        </div>
      </section>

      {/* Create Chart Section */}
      <section className="px-6 py-16 bg-white dark:bg-slate-700">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold font-title text-center mb-12">
            {t("createChart")}
          </h2>
          <Box classNameOuter="mb-8" padding={6}>
            <div className="space-y-4 text-lg">
              <p>{ta("1.content3")}</p>
              <p>{ta("1.content4")}</p>
              <p>{ta("3.content1")}</p>
              <p>{t("createChartDesc2")}</p>
              <p>{ta("3.content4")}</p>
              <p>{t("createChartDesc3")}</p>
            </div>
          </Box>
          <div className="text-center mt-8">
            <Link
              href={`/${locale}/main/edit`}
              className={clsx(
                "inline-block px-8 py-3 text-lg font-semibold rounded-full",
                "bg-gradient-to-r from-purple-500 to-pink-500",
                "text-white shadow-lg",
                "hover:from-purple-600 hover:to-pink-600",
                "transition-all duration-200"
              )}
            >
              {t("createChart")}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer with links */}
      <footer className="px-6 py-12 bg-gray-100 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-6">
            <Link
              href={`/${locale}/main/policies`}
              className="text-blue-500 hover:text-blue-600 underline"
            >
              {t("policies")}
            </Link>
            <span className="hidden md:inline text-gray-400">•</span>
            <Link
              href={`/${locale}/main/links`}
              className="text-blue-500 hover:text-blue-600 underline"
            >
              {t("links")}
            </Link>
            <span className="hidden md:inline text-gray-400">•</span>
            <Link
              href={`/${locale}`}
              className="text-blue-500 hover:text-blue-600 underline"
            >
              {t("backToOriginal")}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
