import PlayTab from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { ChartBrief, originalCId, sampleCId } from "@falling-nikochan/chart";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import briefApp from "@falling-nikochan/route/dist/src/api/brief.js";
import { ChartLineBrief } from "../fetch.js";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.play");
  return initMetadata(params, "/main/play", t("title"), t("description"));
}

export default async function Page({ params }: MetadataProps) {
  const pSampleBriefs = sampleCId.map(async (cid) => {
    try {
      return {
        cid,
        fetched: true,
        brief: (await (await briefApp.request(`/${cid}`)).json()) as ChartBrief,
      } satisfies ChartLineBrief;
    } catch (e) {
      if (
        process.env.NODE_ENV === "development" ||
        process.env.ALLOW_FETCH_ERROR
      ) {
        console.error(`Error fetching brief for ${cid}:`, e);
        return {
          cid,
          fetched: true,
          brief: undefined,
        } satisfies ChartLineBrief;
      } else {
        throw e;
      }
    }
  });
  const pOriginalBriefs = originalCId.map(async (cid) => {
    try {
      return {
        cid,
        fetched: true,
        brief: (await (await briefApp.request(`/${cid}`)).json()) as ChartBrief,
        original: true,
      } satisfies ChartLineBrief;
    } catch (e) {
      if (
        process.env.NODE_ENV === "development" ||
        process.env.ALLOW_FETCH_ERROR
      ) {
        console.error(`Error fetching brief for ${cid}:`, e);
        return {
          cid,
          fetched: true,
          brief: undefined,
          original: true,
        } satisfies ChartLineBrief;
      } else {
        throw e;
      }
    }
  });
  return (
    <PlayTab
      locale={(await params).locale}
      sampleBriefs={await Promise.all(pSampleBriefs)}
      originalBriefs={await Promise.all(pOriginalBriefs)}
    />
  );
}
