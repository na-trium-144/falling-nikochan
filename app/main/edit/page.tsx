"use client";

import { useEffect, useState } from "react";
import { buttonStyle } from "@/common/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRecent, removeRecent } from "@/common/recent";
import { ChartBrief, validCId } from "@/chartFormat/chart";
import { IndexMain } from "../main";
import Input from "@/common/input";
import { ChartListItem } from "../chartList";
import { rateLimitMin } from "@/api/dbRateLimit";
import { LoadingSlime } from "@/common/loadingSlime";
import { linkStyle1 } from "@/common/linkStyle";
import { EfferentThree } from "@icon-park/react";
import { ExternalLink } from "@/common/extLink";

export default function EditTab() {
  const [recentCId, setRecentCId] = useState<string[]>([]);
  const [recentBrief, setRecentBrief] = useState<{
    [key in string]: ChartBrief;
  }>({});
  const [fetching, setFetching] = useState<number>(1);
  const router = useRouter();

  useEffect(() => {
    const recentCId = getRecent("edit");
    setRecentCId(recentCId);
    setFetching(recentCId.length);
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
        setFetching((fetching) => fetching - 1);
      })();
    }
  }, []);

  const [cidErrorMsg, setCIdErrorMsg] = useState<string>("");
  const [cidFetching, setCidFetching] = useState<boolean>(false);
  const gotoCId = async (cid: string) => {
    setCIdErrorMsg("");
    setCidFetching(true);
    const res = await fetch(`/api/brief/${cid}`, { cache: "no-store" });
    if (res.ok) {
      router.push(`/edit/${cid}`);
    } else {
      setCidFetching(false);
      try {
        setCIdErrorMsg((await res.json()).message);
      } catch {
        setCIdErrorMsg("");
      }
    }
  };

  return (
    <IndexMain tab={2}>
      <p className="mb-3 text-justify">
        Falling Nikochan の譜面エディタにようこそ。
        アカウント登録不要で誰でも譜面を作成することができます。
      </p>
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
          <span className={cidFetching ? "inline-block " : "hidden "}>
            <LoadingSlime />
            Loading...
          </span>
          <span className="ml-1 inline-block">{cidErrorMsg}</span>
        </h3>
        <p className="pl-2 text-justify">
          編集したい譜面の ID を知っている場合はこちらに入力してください。 ID
          入力後、編集用パスワードも必要になります。
        </p>
      </div>
      <div className="mb-3">
        <h3 className="text-xl font-bold font-title mb-2">最近編集した譜面</h3>
        <p className={"pl-2 " + (fetching > 0 ? "" : "hidden ")}>
          <LoadingSlime />
          Loading...
        </p>
        <div className={fetching > 0 ? "hidden " : ""}>
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
      </div>
      <div className="mb-3">
        <h3 className="mb-2">
          <span className="text-xl font-bold font-title ">
            新しく譜面を作る:
          </span>
          <ExternalLink className="ml-3" href="/edit/new">
            新規作成
          </ExternalLink>
        </h3>
        <p className="pl-2 text-justify">
          新しくサーバーに譜面を保存するのは{rateLimitMin}
          分ごとに1回までに制限しています。
          (1度保存した譜面の上書きは何回でもできます。)
        </p>
      </div>
    </IndexMain>
  );
}
