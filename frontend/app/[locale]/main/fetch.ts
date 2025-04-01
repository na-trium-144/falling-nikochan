"use client";

import { ChartBrief, originalCId, sampleCId } from "@falling-nikochan/chart";
import { fetchBrief } from "@/common/briefCache";
import { useEffect, useState } from "react";
import { getRecent, updateRecent } from "@/common/recent";

export const chartListMaxRow = 6;
export type ChartListType = "recent" | "popular" | "latest" | "sample";
export interface ChartLineBrief {
  cid: string;
  fetched: boolean;
  brief?: ChartBrief;
  original?: boolean;
}

export function useChartListFetcher(type: ChartListType, fetchAll: boolean) {
  const [briefsState, setBriefsState] = useState<ChartLineBrief[] | "error">();
  useEffect(() => {
    switch (type) {
      case "recent":
        setBriefsState(
          getRecent("play")
            .reverse()
            .map((cid) => ({ cid, fetched: false })),
        );
        break;
      case "sample":
        setBriefsState(
          originalCId.map((cid) => ({ cid, fetched: false, original: true } as ChartLineBrief)).concat(sampleCId.map((cid) => ({ cid, fetched: false })))
          )
      break;
    case "latest":
    case "popular":
          void (async () => {
      try {
        const latestRes = await fetch(
          process.env.BACKEND_PREFIX + `/api/${type}`,
          {cache: "default"},
        );
        if (latestRes.ok) {
          const latestCId = (await latestRes.json()) as { cid: string }[];
          setBriefsState(latestCId.map(({ cid }) => ({ cid, fetched: false })));
        } else {
          setBriefsState("error");
        }
      } catch (e) {
        console.error(e);
        setBriefsState("error");
      }
    })();
    }
  }, [type]);
  useEffect(() => {
    void (async () => {
      if (Array.isArray(briefsState)) {
        const { changed, briefs } = await fetchAndFilterBriefs(
          briefsState,
          fetchAll,
        );
        if (changed) {
          setBriefsState(briefs);
          if (type === "recent") {
            updateRecent("play", briefs.map(({ cid }) => cid).reverse());
          }
        }
      }
    })();
  }, [briefsState, type, fetchAll]);

  return briefsState;
}

async function fetchAndFilterBriefs(
  recentBrief: ChartLineBrief[],
  fetchAll: boolean,
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
        const { brief, is404 } = await fetchBrief(cid);
        recentBriefNew[i] = is404
          ? null
          : { cid, fetched: true, brief, original };
        changed = true;
      }
    }),
  );
  return {
    changed,
    briefs: recentBriefNew.filter((brief) => brief !== null),
  };
}
