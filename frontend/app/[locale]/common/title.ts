import { ChartBrief, ChartUntil15Min } from "@falling-nikochan/chart";

export const titleWithSiteName = (title: string) =>
  (title ? `${title} | Falling Nikochan` : "Falling Nikochan") +
  (process.env.TITLE_SUFFIX ? ` ${process.env.TITLE_SUFFIX}` : "");
export const titleWithoutSiteName = (title: string) =>
  title ||
  "Falling Nikochan" +
    (process.env.TITLE_SUFFIX ? ` ${process.env.TITLE_SUFFIX}` : "");

export function titleShare(
  t: any,
  cid?: string,
  brief?: ChartUntil15Min | ChartBrief | null
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
  brief: ChartUntil15Min | ChartBrief | null | undefined,
  date: Date | undefined
): string {
  if (date) {
    return t("titleWithResult", {
      date: date.toLocaleDateString(),
      title: titleShare(t, cid, brief),
    });
  } else {
    return t("titleWithResultNoDate", {
      title: titleShare(t, cid, brief),
    });
  }
}
