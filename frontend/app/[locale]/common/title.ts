import { ChartBrief, ChartMin } from "@falling-nikochan/chart";

export const titleWithSiteName = (title: string) =>
  title ? `${title} | Falling Nikochan` : "Falling Nikochan";
export const titleWithoutSiteName = (title: string) =>
  title || "Falling Nikochan";

export function titleShare(
  t: any,
  cid?: string,
  brief?: ChartMin | ChartBrief | null
): string {
  return titleWithSiteName(
    brief?.composer
      ? t("titleWithComposer", {
          title: brief?.title,
          composer: brief?.composer,
          chartCreator: brief?.chartCreator,
          cid: cid,
        })
      : t("title", {
          title: brief?.title,
          chartCreator: brief?.chartCreator,
          cid: cid,
        })
  );
}
export function titleShareResult(
  t: any,
  cid?: string,
  brief?: ChartMin | ChartBrief | null
): string {
  return t("sharedResult") + " | " + titleShare(t, cid, brief);
}
