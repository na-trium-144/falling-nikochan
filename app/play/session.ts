import { ChartBrief } from "@/chartFormat/chart";

interface SessionData {
  cid: string;
  lvIndex: number;
  brief: ChartBrief;
}
// sessionStorageとlocalStorageの両方に保存し、sessionIdを返す
export function initSession(
  cid: string,
  lvIndex: number,
  brief: ChartBrief,
  sessionId?: number,
): number {
  const sessionData = { cid, lvIndex, brief } as SessionData;
  if(sessionId === undefined) {
    sessionId = (Number(localStorage.getItem("lastSessionId")) || 0) + 1;
    localStorage.setItem("lastSessionId", String(sessionId));
  }
  sessionStorage.setItem("session", JSON.stringify(sessionData));
  localStorage.setItem(`session-${sessionId}`, JSON.stringify(sessionData));
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
