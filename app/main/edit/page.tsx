"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRecent, removeRecent } from "@/common/recent";
import { ChartBrief, validCId } from "@/chartFormat/chart";
import { IndexMain } from "../main";
import Input from "@/common/input";
import { ChartList } from "../chartList";
import { rateLimitMin } from "@/api/dbRateLimit";
import { LoadingSlime } from "@/common/loadingSlime";
import { ExternalLink } from "@/common/extLink";

export default function EditTab() {
  const router = useRouter();

  const [recentCIdAdditional, setRecentCIdAdditional] = useState<string[]>([]);
  const [recentBrief, setRecentBrief] =
    useState<{ cid?: string; brief?: ChartBrief }[]>();
  const [recentBriefAdditional, setRecentBriefAdditional] =
    useState<{ cid?: string; brief?: ChartBrief }[]>();

  const fetchBrief = useCallback(async (cid: string) => {
    const res = await fetch(`/api/brief/${cid}`, { cache: "default" }); // todo: /api/brief からのレスポンスにmax-ageがないので意味ない?
    if (res.ok) {
      // cidからタイトルなどを取得
      const resBody = await res.json();
      return { cid, brief: resBody as ChartBrief };
    } else if (res.status === 404) {
      return {};
    } else {
      return { cid };
    }
  }, []);
  useEffect(() => {
    const recentCIdAll = getRecent("play").reverse();
    const recentCId = recentCIdAll.slice(0, 5);
    const recentCIdAdditional = recentCIdAll.slice(5);
    setRecentCIdAdditional(recentCIdAdditional);
    void (async () => {
      setRecentBrief(
        await Promise.all(recentCId.map((cid) => fetchBrief(cid)))
      );
    })();
  }, [fetchBrief]);
  const fetchAdditional = () => {
    void (async () => {
      setRecentBriefAdditional(
        await Promise.all(recentCIdAdditional.map((cid) => fetchBrief(cid)))
      );
    })();
  };

  const [cidErrorMsg, setCIdErrorMsg] = useState<string>("");
  const [cidFetching, setCidFetching] = useState<boolean>(false);
  const [inputCId, setInputCId] = useState<string>("");
  const gotoCId = async (cid: string) => {
    setCIdErrorMsg("");
    setCidFetching(true);
    const res = await fetch(`/api/brief/${cid}`, { cache: "no-store" });
    setCidFetching(false);
    if (res.ok) {
      // router.push(`/edit/${cid}`);
      window.open(`/edit/${cid}`, "_blank")?.focus(); // これで新しいタブが開かない場合がある
      setCIdErrorMsg("");
      setInputCId(cid);
    } else {
      try {
        setCIdErrorMsg((await res.json()).message);
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
            className={"ml-1 " + (inputCId !== "" ? "" : "hidden ")}
            href={`/edit/${inputCId}`}
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
          recentBriefAdditional={recentBriefAdditional}
          hasRecentAdditional={recentCIdAdditional.length}
          fetchAdditional={fetchAdditional}
          href={(cid) => `/edit/${cid}`}
          newTab
        />
      </div>
      <div className="mb-3">
        <h3 className="mb-2">
          <span className="text-xl font-bold font-title ">
            新しく譜面を作る:
          </span>
          <ExternalLink className="ml-3" href="/edit/new">
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
