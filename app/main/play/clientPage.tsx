"use client";

import { useCallback, useEffect, useState } from "react";
import { ChartBrief, validCId } from "@/chartFormat/chart";
import { useRouter } from "next/navigation";
import { getRecent, removeRecent } from "@/common/recent";
import Input from "@/common/input";
import { IndexMain } from "../main";
import { ChartList, ChartListItem } from "../chartList";
import { LoadingSlime } from "@/common/loadingSlime";
import { Youtube } from "@icon-park/react";
import { ExternalLink } from "@/common/extLink";

export default function PlayTab(props: {
  sampleBrief: { cid: string; brief: ChartBrief | undefined }[];
  originalBrief: { cid: string; brief: ChartBrief | undefined }[];
}) {
  const [recentCIdAdditional, setRecentCIdAdditional] = useState<string[]>([]);
  const [recentBrief, setRecentBrief] =
    useState<{ cid?: string; brief?: ChartBrief }[]>();
  const [recentBriefAdditional, setRecentBriefAdditional] =
    useState<{ cid?: string; brief?: ChartBrief }[]>();
  const router = useRouter();

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
          recentBrief={recentBrief}
          recentBriefAdditional={recentBriefAdditional}
          hasRecentAdditional={recentCIdAdditional.length}
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
          が作った譜面です。 初めての方はこちらからどうぞ。 また、これ以外にも
          Falling Nikochan の YouTube チャンネル
          <ExternalLink
            className="mx-1"
            href="https://www.youtube.com/@nikochan144"
            icon={
              <Youtube className="absolute left-0 bottom-1" theme="filled" />
            }
          >
            <span className="text-sm">@nikochan144</span>
          </ExternalLink>
          で譜面を公開しています。
        </p>
        <ul className={"list-disc list-inside ml-3 "}>
          {props.originalBrief.map(({ cid, brief }) => (
            <ChartListItem
              key={cid}
              cid={cid}
              brief={brief}
              href={`/share/${cid}`}
              original
            />
          ))}
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
