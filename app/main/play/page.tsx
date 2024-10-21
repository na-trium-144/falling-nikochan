"use client";

import { useEffect, useState } from "react";
import { ChartBrief, validCId } from "@/chartFormat/chart";
import { useRouter } from "next/navigation";
import { getRecent, removeRecent } from "@/common/recent";
import Input from "@/common/input";
import { IndexMain } from "../main";
import { ChartListItem } from "../chartList";
import { LoadingSlime } from "@/common/loadingSlime";

const sampleCId = ["596134", "592994", "488006"];

export default function PlayTab() {
  const [recentCId, setRecentCId] = useState<string[]>([]);
  const [recentBrief, setRecentBrief] = useState<{
    [key in string]: ChartBrief;
  }>({});
  const [fetching, setFetching] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const recentCId = getRecent("play");
    setRecentCId(recentCId);
    const recentAndSampleCId = [...new Set(recentCId.concat(sampleCId))];
    setFetching(recentAndSampleCId.length);
    for (const cid of recentAndSampleCId) {
      // recentCIdもsampleCIdもまとめて扱い、受信したデータをrecentBriefに全部入れる
      void (async () => {
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
          setRecentCId((recentCId) =>
            recentCId.filter((oldCId) => oldCId !== cid)
          );
        }
        setFetching((fetching) => fetching - 1);
      })();
    }
  }, []);

  const [cidErrorMsg, setCIdErrorMsg] = useState<string>("");
  const gotoCId = async (cid: string) => {
    setCIdErrorMsg("");
    const res = await fetch(`/api/brief/${cid}`, { cache: "no-store" });
    if (res.ok) {
      router.push(`/share/${cid}`);
    } else {
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
            natrium144.
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
        {fetching > 0 ? (
          <p className="pl-2">
            <LoadingSlime />
            Loading...
          </p>
        ) : recentCId.length > 0 ? (
          <ul className="ml-3">
            {recentCId.map((cid) => (
              <ChartListItem
                key={cid}
                cid={cid}
                brief={recentBrief[cid]}
                href={`/share/${cid}`}
                creator
              />
            ))}
          </ul>
        ) : (
          <p className="pl-2">まだありません</p>
        )}
      </div>
      <div className="mb-3">
        <h3 className="text-xl font-bold font-title mb-2">サンプル譜面</h3>
        <p className="pl-2 mb-1 text-justify ">
          Falling Nikochan の作者
          <span className="text-sm mx-0.5">(na-trium-144)</span>
          が作った譜面です。 初めての方はこちらからどうぞ。
        </p>
        {fetching > 0 ? (
          <p className="pl-2">
            <LoadingSlime />
            Loading...
          </p>
        ) : (
          <>
            <ul className="list-disc list-inside ml-3">
              {sampleCId.map((cid) => (
                <ChartListItem
                  key={cid}
                  cid={cid}
                  brief={recentBrief[cid]}
                  href={`/share/${cid}`}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </IndexMain>
  );
}
