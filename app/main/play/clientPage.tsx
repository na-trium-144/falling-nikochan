"use client";

import { useCallback, useEffect, useState } from "react";
import { ChartBrief, validCId } from "@/chartFormat/chart";
import { useRouter } from "next/navigation";
import { getRecent, removeRecent } from "@/common/recent";
import Input from "@/common/input";
import { IndexMain } from "../main";
import { ChartList, ChartListItem } from "../chartList";
import { LoadingSlime } from "@/common/loadingSlime";

export default function PlayTab(props: {
  sampleBrief: { cid: string; brief?: ChartBrief }[];
}) {
  const [recentCId, setRecentCId] = useState<string[]>([]);
  const [recentCIdAdditional, setRecentCIdAdditional] = useState<string[]>([]);
  const [recentBrief, setRecentBrief] = useState<{
    [key in string]: ChartBrief;
  }>({});
  const [fetching, setFetching] = useState<number>(1);
  const [fetchingAdditional, setFetchingAdditional] = useState<number>(1);
  const router = useRouter();

  const fetchBrief = useCallback(async (cid: string) => {
    const res = await fetch(`/api/brief/${cid}`, { cache: "no-store" });
    if (res.ok) {
      // cidからタイトルなどを取得
      const resBody = await res.json();
      setRecentBrief((recentBrief) => {
        recentBrief[cid] = resBody;
        return { ...recentBrief };
      });
    } else if (res.status === 404) {
      // 存在しない譜面のデータは消す
      removeRecent("play", cid);
      setRecentCId((recentCId) => recentCId.filter((oldCId) => oldCId !== cid));
      setRecentCIdAdditional((recentCId) =>
        recentCId.filter((oldCId) => oldCId !== cid)
      );
    }
  }, []);
  useEffect(() => {
    const recentCIdAll = getRecent("play").reverse();
    const recentCId = recentCIdAll.slice(0, 5);
    const recentCIdAdditional = recentCIdAll.slice(5);
    setRecentCId(recentCId);
    setRecentCIdAdditional(recentCIdAdditional);
    setFetching(recentCId.length);
    setFetchingAdditional(recentCIdAdditional.length);
    for (const cid of recentCId) {
      void (async () => {
        await fetchBrief(cid);
        setFetching((fetching) => fetching - 1);
      })();
    }
  }, [fetchBrief]);
  const fetchAdditional = () => {
    for (const cid of recentCIdAdditional) {
      void (async () => {
        await fetchBrief(cid);
        setFetchingAdditional((fetchingAdditional) => fetchingAdditional - 1);
      })();
    }
  };

  const [cidErrorMsg, setCIdErrorMsg] = useState<string>("");
  const [cidFetching, setCidFetching] = useState<boolean>(false);
  const gotoCId = async (cid: string) => {
    setCIdErrorMsg("");
    setCidFetching(true);
    const res = await fetch(`/api/brief/${cid}`, { cache: "no-store" });
    if (res.ok) {
      router.push(`/share/${cid}`);
    } else {
      setCidFetching(false);
      try {
        setCIdErrorMsg((await res.json()).message);
      } catch (e) {
        setCIdErrorMsg(String(e));
      }
    }
  };

  return (
    <IndexMain tab={1}>
      <div className="mb-3">
        <h3 className="mb-2">
          <span className="text-xl font-bold font-title">譜面IDを入力:</span>
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
        </h3>
        <p className="pl-2 text-justify">
          プレイしたい譜面の ID を知っている場合はこちらに入力してください。
        </p>
        <p className="pl-2 text-justify">
          ※譜面のURL (
          <span className="text-sm">
            nikochan.
            <wbr />
            natrium
            <wbr />
            144.
            <wbr />
            org
            <wbr />
            &#47;
            <wbr />
            share
            <wbr />
            &#47;〜
          </span>
          ) にアクセスすることでもプレイできます。
        </p>
      </div>
      <div className="mb-3">
        <h3 className="text-xl font-bold font-title mb-2">
          最近プレイした譜面
        </h3>
        <ChartList
          recentCId={recentCId}
          recentCIdAdditional={recentCIdAdditional}
          recentBrief={recentBrief}
          fetching={fetching > 0}
          fetchingAdditional={fetchingAdditional > 0}
          fetchAdditional={fetchAdditional}
          creator
          href={(cid) => `/share/${cid}`}
        />
      </div>
      <div className="mb-3">
        <h3 className="text-xl font-bold font-title mb-2">サンプル譜面</h3>
        <p className="pl-2 mb-1 text-justify ">
          Falling Nikochan の作者
          <span className="text-sm mx-0.5">(na-trium-144)</span>
          が作った譜面です。 初めての方はこちらからどうぞ。
        </p>
        <ul className={"list-disc list-inside ml-3 "}>
          {props.sampleBrief.map(({ cid, brief }) => (
            <ChartListItem
              key={cid}
              cid={cid}
              brief={brief}
              href={`/share/${cid}`}
            />
          ))}
        </ul>
      </div>
    </IndexMain>
  );
}
