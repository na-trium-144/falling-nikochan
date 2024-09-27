"use client";

import { useEffect, useState } from "react";
import { ChartBrief } from "@/chartFormat/chart";
import { useRouter } from "next/navigation";
import { getRecent, removeRecent } from "@/common/recent";
import Link from "next/link";
import Input from "@/common/input";
import { IndexMain } from "../main";

const sampleCId = ["762237"];

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
          className="ml-4 w-20"
          actualValue=""
          updateValue={gotoCId}
          isValid={(v) =>
            v.length === 6 && Number(v) >= 100000 && Number(v) < 1000000
          }
          left
        />
        <span className="ml-1 inline-block">{cidErrorMsg}</span>
      </h3>
      <p className="pl-2 break-keep break-words">
        プレイしたい
        <wbr />
        譜面の
        <wbr />
        IDを
        <wbr />
        知って
        <wbr />
        いる
        <wbr />
        場合は
        <wbr />
        こちらに
        <wbr />
        入力して
        <wbr />
        ください。
      </p>
      <p className="pl-2 break-keep break-words">
        ※譜面のURL (
        <span className="text-sm">
          {hostname}&#47;
          <wbr />
          share
          <wbr />
          &#47;*
        </span>
        ) に<wbr />
        アクセス
        <wbr />
        する
        <wbr />
        ことでも
        <wbr />
        プレイ
        <wbr />
        できます。
      </p>
      <h3 className="text-xl font-bold font-title mt-3 mb-2">
        最近プレイした譜面
      </h3>
      {recentCId.length > 0 ? (
        <ul className="ml-3">
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
    <li className="flex flex-row items-start w-full">
      <span className="flex-none mr-2">•</span>
      <Link
        href={`/share/${props.cid}`}
        className="flex-1 min-w-0 hover:text-slate-500 "
      >
        <span className="inline-block">
          <span className="inline-block ">{props.cid}:</span>
          <span className="inline-block ml-2 font-title">
            {props.brief?.title}
          </span>
        </span>
        <span className="inline-block ml-2 text-sm">
          <span className="">by</span>
          <span className="ml-1 font-title ">{props.brief?.chartCreator}</span>
        </span>
      </Link>
    </li>
  );
}
