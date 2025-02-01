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

