"use client";

import { useCallback, useEffect, useState } from "react";
import { ChartBrief, validCId } from "@/chartFormat/chart";
import { useRouter } from "next/navigation";
import { getRecent, removeRecent, updateRecent } from "@/common/recent";
import Input from "@/common/input";
import { IndexMain } from "../main";
import { ChartList, ChartListItem } from "../chartList";
import { LoadingSlime } from "@/common/loadingSlime";
import { Youtube } from "@icon-park/react";
import { ExternalLink } from "@/common/extLink";
import { numLatest } from "@/api/latest/const";

export const chartListMaxRow = 5;
export interface ChartLineBrief {
  cid: string;
  fetched: boolean;
  brief?: ChartBrief;
}

export async function fetchBrief(cid: string): Promise<ChartLineBrief | null> {
  const res = await fetch(process.env.BACKEND_PREFIX + `/api/brief/${cid}`, { cache: "default" });
  if (res.ok) {
    // cidからタイトルなどを取得
    const resBody = await res.json();
    return { cid, fetched: true, brief: resBody as ChartBrief };
  } else if (res.status === 404) {
    return null;
  } else {
    return { cid, fetched: true };
  }
}
export async function fetchAndFilterBriefs(
  recentBrief: ChartLineBrief[],
  fetchAll: boolean
): Promise<{ changed: boolean; briefs: ChartLineBrief[] }> {
  let changed = false;
  const recentBriefNew: (ChartLineBrief | null)[] = recentBrief.slice();
  await Promise.all(
    recentBrief.map(async ({ cid, fetched, brief }, i) => {
      if (fetched) {
        return;
      } else if (!fetchAll && i >= chartListMaxRow) {
        return;
      } else {
        const brief = await fetchBrief(cid);
        recentBriefNew[i] = brief;
        changed = true;
      }
    })
  );
  return {
    changed,
    briefs: recentBriefNew.filter((brief) => brief !== null),
  };
}

export default function PlayTab(props: {
  sampleBrief: { cid: string; brief: ChartBrief | undefined }[];
  originalBrief: { cid: string; brief: ChartBrief | undefined }[];
}) {
  const [recentBrief, setRecentBrief] = useState<ChartLineBrief[]>();
  const [fetchRecentAll, setFetchRecentAll] = useState<boolean>(false);
  const [latestBrief, setLatestBrief] = useState<ChartLineBrief[]>();
  const [fetchLatestAll, setFetchLatestAll] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const recentCId = getRecent("play").reverse();
    setRecentBrief(recentCId.map((cid) => ({ cid, fetched: false })));
    void (async () => {
      const latestCId = (await (
        await fetch(process.env.BACKEND_PREFIX + `/api/latest`, { cache: "default" })
      ).json()) as { cid: string }[];
      setLatestBrief(latestCId.map(({ cid }) => ({ cid, fetched: false })));
    })();
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
          updateRecent("play", briefs.map(({ cid }) => cid).reverse());
        }
      }
    })();
  }, [recentBrief, fetchRecentAll]);
  useEffect(() => {
    void (async () => {
      if (latestBrief) {
        const { changed, briefs } = await fetchAndFilterBriefs(
          latestBrief,
          fetchLatestAll
        );
        if (changed) {
          setLatestBrief(briefs);
        }
      }
    })();
  }, [latestBrief, fetchLatestAll]);

  const [cidErrorMsg, setCIdErrorMsg] = useState<string>("");
  const [cidFetching, setCidFetching] = useState<boolean>(false);
  const gotoCId = async (cid: string) => {
    setCIdErrorMsg("");
    setCidFetching(true);
    const res = await fetch(process.env.BACKEND_PREFIX + `/api/brief/${cid}`, { cache: "no-store" });
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
          maxRow={chartListMaxRow}
          fetchAdditional={() => setFetchRecentAll(true)}
          creator
          href={(cid) => `/share/${cid}`}
        />
      </div>
      <div className="mb-3">
        <h3 className="text-xl font-bold font-title mb-2">新着譜面</h3>
        <p className="pl-2 text-justify ">
          最近作成・更新された譜面の一覧です。
          {/*<span className="text-sm ">(最新の{numLatest}件まで)</span>*/}
        </p>
        <p className="pl-2 mb-1 text-justify text-sm ">
          (譜面を制作する方へ:
          譜面編集から「一般公開する」にチェックを入れると、数分後にここに反映されます。)
        </p>
        <ChartList
          recentBrief={latestBrief}
          maxRow={chartListMaxRow}
          fetchAdditional={() => setFetchLatestAll(true)}
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
