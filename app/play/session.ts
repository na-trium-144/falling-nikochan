import { Chart, ChartBrief, Level } from "@/chartFormat/chart";

export interface SessionData {
  cid?: string;
  lvIndex: number;
  brief: ChartBrief;
  chart?: Chart;
}
// sessionStorageとlocalStorageの両方に保存し、sessionIdを返す
export function initSession(
  data: SessionData,
  sessionId?: number,
): number {
  if(sessionId === undefined) {
    sessionId = (Number(localStorage.getItem("lastSessionId")) || 0) + 1;
    localStorage.setItem("lastSessionId", String(sessionId));
  }
  sessionStorage.setItem("session", JSON.stringify(data));
  localStorage.setItem(`session-${sessionId}`, JSON.stringify(data));
  return sessionId;
}
// sessionIdがあればlocalStorageからsessionを取得し、sessionStorageにも保存
// なければsessionStorageから取得
// それもなければnull
export function getSession(sessionId?: number): SessionData | null {
  if (sessionId) {
    const sessionData = JSON.parse(
      localStorage.getItem(`session-${sessionId}`) || "null"
    );
    localStorage.removeItem(`session-${sessionId}`);
    if (sessionData) {
      sessionStorage.setItem("session", JSON.stringify(sessionData));
      return sessionData;
    }
  }
  return JSON.parse(sessionStorage.getItem("session") || "null");
}
