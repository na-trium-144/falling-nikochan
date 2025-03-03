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
          cid: cid,
        })
      : t("title", {
          title: brief?.title,
          cid: cid,
        })
  );
}
export function titleShareResult(
  t: any,
  cid: string | undefined,
  brief: ChartMin | ChartBrief | null | undefined,
  date: Date
): string {
  return t("titleWithResult", {
    date: date?.toLocaleDateString(),
    title: titleShare(t, cid, brief),
  });
}
