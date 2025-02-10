"use client";

import { useEffect, useState } from "react";
import { getRecent, updateRecent } from "@/common/recent.js";
import { validCId } from "@/../../chartFormat/chart.js";
import { IndexMain } from "../main.js";
import Input from "@/common/input.js";
import { ChartList } from "../chartList.js";
import { LoadingSlime } from "@/common/loadingSlime.js";
import { ExternalLink } from "@/common/extLink.js";
import {
  ChartLineBrief,
  chartListMaxRow,
  fetchAndFilterBriefs,
} from "../play/fetch.js";
import { rateLimitMin } from "@/../../chartFormat/apiConfig.js";
import { useTranslations } from "next-intl";

export default function EditTab({ locale }: { locale: string }) {
  const t = useTranslations("main.edit");

  const [recentBrief, setRecentBrief] = useState<ChartLineBrief[]>();
  const [fetchRecentAll, setFetchRecentAll] = useState<boolean>(false);

  useEffect(() => {
    const recentCId = getRecent("edit").reverse();
    setRecentBrief(recentCId.map((cid) => ({ cid, fetched: false })));
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
          updateRecent("edit", briefs.map(({ cid }) => cid).reverse());
        }
      }
    })();
  }, [recentBrief, fetchRecentAll]);

  const [cidErrorMsg, setCIdErrorMsg] = useState<string>("");
  const [cidFetching, setCidFetching] = useState<boolean>(false);
  const [inputCId, setInputCId] = useState<string>("");
  const gotoCId = async (cid: string) => {
    setCIdErrorMsg("");
    setCidFetching(true);
    const res = await fetch(process.env.BACKEND_PREFIX + `/api/brief/${cid}`, {
      cache: "no-store",
    });
    setCidFetching(false);
    if (res.ok) {
      // router.push(`/${locale}/edit?cid=${cid}`);
      window.open(`/${locale}/edit?cid=${cid}`, "_blank")?.focus(); // これで新しいタブが開かない場合がある
      setCIdErrorMsg("");
      setInputCId(cid);
    } else {
      try {
        setCIdErrorMsg(
          String(((await res.json()) as { message?: string }).message)
        );
      } catch {
        setCIdErrorMsg("");
      }
      setInputCId("");
    }
  };

  return (
    <IndexMain tab={2} locale={locale}>
      <p className="mb-3 text-justify">{t("welcome")}</p>
      <div className="mb-3">
        <h3 className="mb-2">
          <span className="text-xl font-bold font-title ">
            {t("inputId")}:
          </span>
          <Input
            className="ml-4 w-20"
            actualValue={inputCId}
            updateValue={gotoCId}
            updateInvalidValue={() => setInputCId("")}
            isValid={validCId}
            left
          />
          <ExternalLink
            className={"ml-1 " + (inputCId !== "" ? "" : "hidden! ")}
            href={`/${locale}/edit?cid=${inputCId}`}
          >
            {t("newTab")}
          </ExternalLink>
          <span className={cidFetching ? "inline-block " : "hidden "}>
            <LoadingSlime />
            Loading...
          </span>
          <span className="ml-1 inline-block">{cidErrorMsg}</span>
        </h3>
        <p className="pl-2 text-justify">{t("inputIdDesc")}</p>
      </div>
      <div className="mb-3">
        <h3 className="text-xl font-bold font-title mb-2">
          {t("recentEdit")}
        </h3>
        <ChartList
          recentBrief={recentBrief}
          maxRow={chartListMaxRow}
          fetchAdditional={() => setFetchRecentAll(true)}
          href={(cid) => `/${locale}/edit?cid=${cid}`}
          newTab
          showLoading
        />
      </div>
      <div className="mb-3">
        <h3 className="mb-2">
          <span className="text-xl font-bold font-title ">{t("new")}:</span>
          <ExternalLink className="ml-3" href={`/${locale}/edit?cid=new`}>
            {t("newButton")}
          </ExternalLink>
        </h3>
        <p className="pl-2 text-justify">{t("newDesc", { rateLimitMin })}</p>
      </div>
    </IndexMain>
  );
}
