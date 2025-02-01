"use client";

import { validCId } from "@/chartFormat/chart";
import {
  ChartLineBrief,
  chartListMaxRow,
  fetchAndFilterBriefs,
} from "./clientPage";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRecent, updateRecent } from "@/common/recent";
import { IndexMain } from "../main";
import Input from "@/common/input";
import { LoadingSlime } from "@/common/loadingSlime";
import { ChartList, ChartListItem } from "../chartList";
import { ExternalLink } from "@/common/extLink";
import { Youtube } from "@icon-park/react";
import { originalCId, sampleCId } from "../const";

export const dynamic = "force-static";

export default function PlayTab() {
  const [recentBrief, setRecentBrief] = useState<ChartLineBrief[]>();
  const [fetchRecentAll, setFetchRecentAll] = useState<boolean>(false);
  const [latestBrief, setLatestBrief] = useState<ChartLineBrief[]>();
  const [fetchLatestAll, setFetchLatestAll] = useState<boolean>(false);
  const [originalBrief, setOriginalBrief] = useState<ChartLineBrief[]>();
  const fetchOriginalAll = true;
  const [sampleBrief, setSampleBrief] = useState<ChartLineBrief[]>();
  const fetchSampleAll = true;
  const router = useRouter();

  useEffect(() => {
    const recentCId = getRecent("play").reverse();
    setRecentBrief(recentCId.map((cid) => ({ cid, fetched: false })));
    setOriginalBrief(originalCId.map((cid) => ({ cid, fetched: false })));
    setSampleBrief(sampleCId.map((cid) => ({ cid, fetched: false })));
    void (async () => {
      const latestCId = (await (
        await fetch(process.env.BACKEND_PREFIX + `/api/latest`, {
          cache: "default",
        })
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
  useEffect(() => {
    void (async () => {
      if (originalBrief) {
        const { changed, briefs } = await fetchAndFilterBriefs(
          originalBrief,
          fetchOriginalAll
        );
        if (changed) {
          setOriginalBrief(briefs);
        }
      }
    })();
  }, [originalBrief, fetchOriginalAll]);
  useEffect(() => {
    void (async () => {
      if (sampleBrief) {
        const { changed, briefs } = await fetchAndFilterBriefs(
          sampleBrief,
          fetchSampleAll
        );
        if (changed) {
          setSampleBrief(briefs);
        }
      }
    })();
  }, [sampleBrief, fetchSampleAll]);

  const [cidErrorMsg, setCIdErrorMsg] = useState<string>("");
  const [cidFetching, setCidFetching] = useState<boolean>(false);
  const gotoCId = async (cid: string) => {
    setCIdErrorMsg("");
    setCidFetching(true);
    const res = await fetch(process.env.BACKEND_PREFIX + `/api/brief/${cid}`, {
      cache: "no-store",
    });
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
          showLoading
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
          showLoading
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
          <ChartList
            recentBrief={originalBrief}
            maxRow={originalBrief?.length || 0}
            href={(cid) => `/share/${cid}`}
            original
            showLoading
          />
          <ChartList
            recentBrief={sampleBrief}
            maxRow={sampleBrief?.length || 0}
            href={(cid) => `/share/${cid}`}
          />
        </ul>
      </div>
    </IndexMain>
  );
}
