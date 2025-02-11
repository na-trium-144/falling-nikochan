"use client";

import { ChartBrief } from "@/../../chartFormat/chart.js";
import { fetchBrief } from "@/common/briefCache";

export const chartListMaxRow = 5;
export interface ChartLineBrief {
  cid: string;
  fetched: boolean;
  brief?: ChartBrief;
  original?: boolean;
}

export async function fetchAndFilterBriefs(
  recentBrief: ChartLineBrief[],
  fetchAll: boolean
): Promise<{ changed: boolean; briefs: ChartLineBrief[] }> {
  let changed = false;
  const recentBriefNew: (ChartLineBrief | null)[] = recentBrief.slice();
  await Promise.all(
    recentBrief.map(async ({ cid, fetched, original }, i) => {
      if (fetched) {
        return;
      } else if (!fetchAll && i >= chartListMaxRow) {
        return;
      } else {
        const {brief, is404} = await fetchBrief(cid);
        recentBriefNew[i] = is404 ? null : {cid, fetched: true, brief, original };
        changed = true;
      }
    })
  );
  return {
    changed,
    briefs: recentBriefNew.filter((brief) => brief !== null),
  };
}

