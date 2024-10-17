import { Chart, ChartBrief } from "@/chartFormat/chart";

export interface SessionData {
  cid?: string;
  lvIndex: number;
  brief: ChartBrief;
  chart?: Chart;
  editing?: boolean;
}
// プレイボタンを押した時にlocalStorageに保存し、sessionIdを返す
// share->play では押すたびにidを発行、edit->playでは使い回し
// localStorageのsessionは多くても1回しか呼ばれないので、容量節約のため定期的に消す
// (initSession時に過去のsessionをぜんぶ消すことにしている)
export function initSession(
  data: SessionData | null,
  sessionId?: number,
): number {
  for(let si = 0; si < localStorage.length; si++){
    if(localStorage.key(si)?.startsWith("session")){
      localStorage.removeItem(localStorage.key(si) || "");
    }
  }

  if(sessionId === undefined) {
    sessionId = (Number(localStorage.getItem("lastSessionId")) || 0) + 1;
    localStorage.setItem("lastSessionId", String(sessionId));
  }
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
