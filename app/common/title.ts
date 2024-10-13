import { ChartBrief } from "@/chartFormat/chart"

export function pageTitle(cid: string, brief: ChartBrief) {
  return brief.title +
    (brief.title && brief.composer ? " / " : brief.title ? " " : "") +
    brief.composer +
    (brief.composer ? " - " : brief.title ? "- " : "") +
    (brief.chartCreator ? "Chart by " + brief.chartCreator : "") +
    ` (ID: ${cid})`;
}