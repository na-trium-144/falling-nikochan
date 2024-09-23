"use client";

import { useEffect, useState } from "react";
import { MetaEdit } from "./edit/[cid]/metaTab";
import Button from "./common/button";
import { useRouter } from "next/navigation";
import msgpack from "@ygoe/msgpack";
import Link from "next/link";
import { getRecentEdit, removeRecentEdit } from "./common/recentEdit";
import { Chart, ChartBrief, emptyChart } from "./chartFormat/chart";

export default function EditTab() {
  const [recentCId, setRecentCId] = useState<string[]>([]);
  const [recentBrief, setRecentBrief] = useState<{
    [key in string]: ChartBrief;
  }>({});
  const [chart, setChart] = useState<Chart>(emptyChart());
  const [errorMsg, setErrorMsg] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const recentCId = getRecentEdit();
    setRecentCId(recentCId);
    for (const cid of recentCId) {
      void (async () => {
        const res = await fetch(`/api/brief/${cid}`, {cache: "no-store"});
        if (res.ok) {
          // cidからタイトルなどを取得
          const resBody = await res.json();
          setRecentBrief((recentBrief) => {
            recentBrief[cid] = resBody;
            return { ...recentBrief };
          });
        } else if (res.status === 404) {
          // 存在しない譜面のデータは消す
          removeRecentEdit(cid);
          setRecentCId((recentCId) =>
            recentCId.filter((oldCId) => oldCId !== cid)
          );
        }
      })();
    }
  }, []);

  return (
    <>
      <h3 className="text-xl font-bold font-title mb-2">最近編集した譜面</h3>
      <ul className="list-disc list-inside">
        {recentCId.map((cid) => (
          <li key={cid}>
            <Link href={`/edit/${cid}`} className="hover:text-blue-600 hover:underline">
              {cid}: {recentBrief[cid]?.title}
            </Link>
          </li>
        ))}
      </ul>
      <h3 className="text-xl font-bold font-title my-2">新規作成</h3>
      <MetaEdit chart={chart} setChart={setChart} />
      <p>※ここで入力した情報は後からでも変更できます。</p>
      <p>
        <Button
          text="新規作成"
          onClick={async () => {
            const res = await fetch(`/api/newChartFile/`, {
              method: "POST",
              body: msgpack.serialize(chart),
              cache: "no-store",
            });
            const resBody = await res.json();
            if (res.ok) {
              if (typeof resBody.cid === "string") {
                router.push(`/edit/${resBody.cid}`);
              } else {
                setErrorMsg("Invalid response");
              }
            } else {
              setErrorMsg(`${res.status}: ${resBody.message}`);
            }
          }}
        />
        <span className="ml-1">{errorMsg}</span>
      </p>
    </>
  );
}
