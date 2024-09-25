"use client";

import { useEffect, useState } from "react";
import { ChartBrief } from "@/chartFormat/chart";
import { useRouter } from "next/navigation";
import { getRecent, removeRecent } from "@/common/recent";
import Link from "next/link";
import Input from "@/common/input";
import { IndexMain } from "../main";

const sampleCId = ["999999"];

export default function PlayTab() {
  const [recentCId, setRecentCId] = useState<string[]>([]);
  const [recentBrief, setRecentBrief] = useState<{
    [key in string]: ChartBrief;
  }>({});
  const router = useRouter();

  useEffect(() => {
    const recentCId = getRecent("play");
    setRecentCId(recentCId);
    for (const cid of recentCId.concat(sampleCId)) {
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

  const [hostname, setHostname] = useState("");
  useEffect(() => setHostname(window.location.host), []);

  return (
    <IndexMain tab={1}>
      <h3 className="mb-2">
        <span className="text-xl font-bold font-title mb-2">譜面IDを入力:</span>
        <Input
          className="ml-4"
          actualValue=""
          updateValue={gotoCId}
          isValid={(v) =>
            v.length === 6 && Number(v) >= 100000 && Number(v) < 1000000
          }
          left
        />
        <span>{cidErrorMsg}</span>
      </h3>
      <p className="pl-2">
        プレイしたい譜面のIDを知っている場合はこちらに入力してください。
      </p>
      <p className="pl-2">
        ※譜面のURL (<span className="text-sm">{hostname}/share/*</span>)
        にアクセスすることでもプレイできます。
      </p>
      <h3 className="text-xl font-bold font-title mt-3 mb-2">
        最近プレイした譜面
      </h3>
      {recentCId.length > 0 ? (
        <ul className="list-disc list-inside ml-3">
          {recentCId.map((cid) => (
            <ChartListItem key={cid} cid={cid} brief={recentBrief[cid]} />
          ))}
        </ul>
      ) : (
        <p className="pl-2">まだありません</p>
      )}
      <h3 className="text-xl font-bold font-title mt-3 mb-2">サンプル譜面</h3>
      <p className="pl-2">はじめての方はこちらから</p>
      <ul className="list-disc list-inside ml-3">
        {sampleCId.map((cid) => (
          <ChartListItem key={cid} cid={cid} brief={recentBrief[cid]} />
        ))}
      </ul>
    </IndexMain>
  );
}

interface CProps {
  cid: string;
  brief?: ChartBrief;
}
function ChartListItem(props: CProps) {
  return (
    <li>
      <Link
        href={`/share/${props.cid}`}
        className="hover:text-blue-600 hover:underline"
      >
        <span className="mr-1.5">{props.cid}:</span>
        <span className="font-title">{props.brief?.title}</span>
        <span className="ml-2 mr-1 text-sm">by</span>
        <span className="font-title text-sm">{props.brief?.chartCreator}</span>
      </Link>
    </li>
  );
}
