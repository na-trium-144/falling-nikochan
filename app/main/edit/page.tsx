"use client";

import { useEffect, useState } from "react";
import { MetaEdit } from "@/edit/[cid]/metaTab";
import Button, { buttonStyle } from "@/common/button";
import { useRouter } from "next/navigation";
import msgpack from "@ygoe/msgpack";
import Link from "next/link";
import { getRecent, removeRecent } from "@/common/recent";
import {
  Chart,
  ChartBrief,
  emptyChart,
  validCId,
} from "@/chartFormat/chart";
import { IndexMain } from "../main";
import { setPasswd } from "@/common/passwdCache";
import Input from "@/common/input";
import { ChartListItem } from "../chartList";

export default function EditTab() {
  const [recentCId, setRecentCId] = useState<string[]>([]);
  const [recentBrief, setRecentBrief] = useState<{
    [key in string]: ChartBrief;
  }>({});
  const [chart, setChart] = useState<Chart>(emptyChart());
  const [errorMsg, setErrorMsg] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const recentCId = getRecent("edit");
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
          removeRecent("edit", cid);
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
      router.push(`/edit/${cid}`);
    } else {
      try {
        setCIdErrorMsg((await res.json()).message);
      } catch {
        setCIdErrorMsg("");
      }
    }
  };

  const [uploadMsg, setUploadMsg] = useState<string>("");
  return (
    <IndexMain tab={2}>
      <div className="mb-3">
        <h3 className="mb-2">
          <span className="text-xl font-bold font-title ">譜面IDを入力:</span>
          <Input
            className="ml-4 w-20"
            actualValue=""
            updateValue={gotoCId}
            isValid={validCId}
            left
          />
          <span className="ml-1 inline-block">{cidErrorMsg}</span>
        </h3>
        <ChartIdDesc />
      </div>
      <div className="mb-3">
        <h3 className="text-xl font-bold font-title mb-2">最近編集した譜面</h3>
        {recentCId.length > 0 ? (
          <ul className="ml-3">
            {recentCId.map((cid) => (
              <ChartListItem
                key={cid}
                cid={cid}
                brief={recentBrief[cid]}
                href={`/edit/${cid}`}
              />
            ))}
          </ul>
        ) : (
          <p className="pl-2">まだありません</p>
        )}
      </div>
      <div className="mb-3">
        <h3 className="mb-2">
          <span className="text-xl font-bold font-title ">
            新しく譜面を作る:
          </span>
          <Link className={buttonStyle + "ml-2 inline-block "} href="/edit/new">
            新規作成
          </Link>
        </h3>
        <p className="pl-2">
          新規譜面作成は30分ごとに1回までできます。
        </p>
      </div>
    </IndexMain>
  );
}

function ChartIdDesc() {
  return (
    <>
      <p className="pl-2 break-keep break-words">
        編集したい
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
        <wbr />
        ID
        <wbr />
        入力後、
        <wbr />
        編集用
        <wbr />
        パスワード
        <wbr />も<wbr />
        必要に
        <wbr />
        なります。
      </p>
    </>
  );
}
