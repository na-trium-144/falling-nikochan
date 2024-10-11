import { ChartBrief } from "@/chartFormat/chart";

export function initSession(cid: string, lvIndex: number, brief: ChartBrief) {
  sessionStorage.setItem("cid", cid);
  sessionStorage.setItem("lvIndex", String(lvIndex));
  sessionStorage.setItem("brief", JSON.stringify(brief));
}
export function getSession() {
  const cid = sessionStorage.getItem("cid");
  const lvIndex = sessionStorage.getItem("lvIndex");
  const brief = sessionStorage.getItem("brief");
  if (cid && lvIndex && brief) {
    return {
      cid,
      lvIndex: Number(lvIndex),
      brief: JSON.parse(brief) as ChartBrief,
    };
  } else {
    return null;
  }
}
