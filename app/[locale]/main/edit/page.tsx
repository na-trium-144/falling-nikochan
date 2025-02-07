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
} from "../play/clientPage.js";
import { rateLimitMin } from "@/../../chartFormat/apiConfig.js";

export const dynamic = "force-static";

export default function EditTab() {
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
      // router.push(`/edit?cid=${cid}`);
      window.open(`/edit?cid=${cid}`, "_blank")?.focus(); // これで新しいタブが開かない場合がある
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
    <IndexMain tab={2}>
      <p className="mb-3 text-justify">
        Falling Nikochan の譜面エディタにようこそ。
        アカウント登録不要で誰でも譜面を作成することができます。
      </p>
      <div className="mb-3">
        <h3 className="mb-2">
          <span className="text-xl font-bold font-title ">譜面IDを入力:</span>
          <Input
            className="ml-4 w-20"
            actualValue={inputCId}
            updateValue={gotoCId}
            updateInvalidValue={() => setInputCId("")}
            isValid={validCId}
            left
          />
          <ExternalLink
            className={"ml-1 " + (inputCId !== "" ? "" : "override:hidden ")}
            href={`/edit?cid=${inputCId}`}
          >
            新しいタブで開く
          </ExternalLink>
          <span className={cidFetching ? "inline-block " : "hidden "}>
            <LoadingSlime />
            Loading...
          </span>
          <span className="ml-1 inline-block">{cidErrorMsg}</span>
        </h3>
        <p className="pl-2 text-justify">
          編集したい譜面の ID を知っている場合はこちらに入力してください。 ID
          入力後、編集用パスワードも必要になります。
        </p>
      </div>
      <div className="mb-3">
        <h3 className="text-xl font-bold font-title mb-2">最近編集した譜面</h3>
        <ChartList
          recentBrief={recentBrief}
          maxRow={chartListMaxRow}
          fetchAdditional={() => setFetchRecentAll(true)}
          href={(cid) => `/edit?cid=${cid}`}
          newTab
          showLoading
        />
      </div>
      <div className="mb-3">
        <h3 className="mb-2">
          <span className="text-xl font-bold font-title ">
            新しく譜面を作る:
          </span>
          <ExternalLink className="ml-3" href="/edit?cid=new">
            新規作成
          </ExternalLink>
        </h3>
        <p className="pl-2 text-justify">
          新しくサーバーに譜面を保存するのは{rateLimitMin}
          分ごとに1回までに制限しています。
          (1度保存した譜面の上書きは何回でもできます。)
        </p>
      </div>
    </IndexMain>
  );
}
