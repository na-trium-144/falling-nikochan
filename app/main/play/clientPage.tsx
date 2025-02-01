"use client";

import { ChartBrief } from "@/chartFormat/chart.js";

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
    recentBrief.map(async ({ cid, fetched }, i) => {
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

