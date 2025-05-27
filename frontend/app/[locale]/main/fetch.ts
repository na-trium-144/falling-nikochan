"use client";

import { ChartBrief } from "@falling-nikochan/chart";
import { fetchBrief } from "@/common/briefCache";

export const chartListMaxRow = 6;
export interface ChartLineBrief {
  cid: string;
  fetched: boolean;
  brief?: ChartBrief;
  original?: boolean;
}

export async function fetchAndFilterBriefs(
  recentBrief: ChartLineBrief[],
  maxRow: number | null = chartListMaxRow
): Promise<{ changed: boolean; briefs: ChartLineBrief[] }> {
  let changed = false;
  const recentBriefNew: (ChartLineBrief | null)[] = recentBrief.slice();
  await Promise.all(
    recentBrief.map(async ({ cid, fetched, original }, i) => {
      if (fetched) {
        return;
      } else if (maxRow !== null && i >= maxRow) {
        return;
      } else {
        const { brief, is404 } = await fetchBrief(cid);
        recentBriefNew[i] = is404
          ? null
          : { cid, fetched: true, brief, original };
        changed = true;
      }
    })
  );
  return {
    changed,
    briefs: recentBriefNew.filter((brief) => brief !== null),
  };
}
