import { ChartBrief } from "@/chartFormat/chart";

export function pageTitle(cid: string, brief: ChartBrief) {
  return (
    brief.title +
    (brief.title && brief.composer ? " / " : brief.title ? " " : "") +
    brief.composer +
    (brief.composer ? " - " : brief.title ? "- " : "") +
    (brief.chartCreator ? "Chart by " + brief.chartCreator : "") +
    ` (ID: ${cid})`
  );
}
export function metaDataTitle(title: string) {
  return {
    title,
    openGraph: {
      title,
      ...ogDefault,
    },
    twitter: {
      title,
      ...twitterDefault,
    },
  };
}
export const description =
  "Simple and cute rhythm game, where anyone can create and share charts.";

export const ogDefault = {
  description,
  // todo: images
  type: "website",
  locale: "ja_JP",
  siteName: "Falling Nikochan",
};
export const twitterDefault = {
  card: "summary",
  description,
  // images
};
