"use client";

import { useEffect, useState } from "react";
import { ChartBrief } from "@/chartFormat/chart";
import { useRouter } from "next/navigation";
import { getRecent, removeRecent } from "@/common/recent";
import Link from "next/link";
import Input from "@/common/input";
import { IndexMain } from "../main";

export default function PlayTab() {
  const [recentCId, setRecentCId] = useState<string[]>([]);
  const [recentBrief, setRecentBrief] = useState<{
    [key in string]: ChartBrief;
  }>({});
  const router = useRouter();

  useEffect(() => {
    const recentCId = getRecent("play");
    setRecentCId(recentCId);
    for (const cid of recentCId) {
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

  return (
    <IndexMain tab={1}>
      <h3>
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
      <h3 className="text-xl font-bold font-title my-2">最近プレイした譜面</h3>
      <ul className="list-disc list-inside">
        {recentCId.map((cid) => (
          <li key={cid}>
            <Link
              href={`/share/${cid}`}
              className="hover:text-blue-600 hover:underline"
            >
              {cid}: {recentBrief[cid]?.title}
            </Link>
          </li>
        ))}
      </ul>
    </IndexMain>
  );
}
