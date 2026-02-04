"use client";

import { IndexMain } from "../main.js";
import { ChartBrief, RecordGetSummary } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { titleShare } from "@/common/title.js";
import { ShareBox } from "@/share/placeholder/shareBox.jsx";
import { fetchBrief } from "@/common/briefCache.js";
import { APIError } from "@/common/apiError.js";

export default function ShareInternal({ locale }: { locale: string }) {
  const t = useTranslations("share");
  const te = useTranslations("error");
  const [cid, setCId] = useState<string | null>(null);
  const [brief, setBrief] = useState<ChartBrief | null>(null);
  const [fromPlay, setFromPlay] = useState<boolean | null>(null);
  const [record, setRecord] = useState<RecordGetSummary[] | APIError | null>(
    null
  );
  const [sessionError, setSessionError] = useState<boolean>(false);
  useEffect(() => {
    const param = new URLSearchParams(window.location.search);
    const cid = param.get("cid");
    const fromPlay = !!param.get("fromPlay");
    if (cid) {
      setCId(cid);
      setFromPlay(fromPlay);
      document.title = titleShare(t, cid);
      fetchBrief(cid).then((res) => {
        if (res.ok) {
          setBrief(res.brief!);
          document.title = titleShare(t, cid, res.brief!);
        }
      });
      setRecord(null);
      (async () => {
        try {
          const res = await fetch(
            process.env.BACKEND_PREFIX + `/api/record/${cid}`
          );
          if (res.ok) {
            try {
              setRecord(await res.json());
            } catch (e) {
              console.error(e);
              setRecord(APIError.badResponse());
            }
          } else {
            setRecord(await APIError.fromRes(res));
          }
        } catch {
          setRecord(APIError.fetchError());
        }
      })();
    } else {
      setSessionError(true);
    }
  }, [t]);

  return (
    <IndexMain
      title={`ID: ${cid || ""}`}
      tabKey={fromPlay === true ? "play" : null}
      mobileTabKey={
        fromPlay === true ? "play" : fromPlay === false ? "top" : null
      }
      locale={locale}
    >
      {sessionError ? (
        te("noSession")
      ) : (
        <ShareBox
          cid={cid || ""}
          brief={brief}
          record={record}
          locale={locale}
        />
      )}
    </IndexMain>
  );
}
