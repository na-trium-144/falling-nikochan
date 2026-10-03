import * as v from "valibot";
import {
  ChartBriefSchema,
  ChartSeqDataSchema,
  LevelFreezeSchema15,
  LevelMetaSchema15,
} from "@falling-nikochan/chart";

const SessionDataSchema = () =>
  v.variant("editing", [
    v.object({
      cid: v.optional(v.string()),
      lvIndex: v.number(),
      brief: ChartBriefSchema(),
      level: v.object({
        freeze: LevelFreezeSchema15(),
        meta: LevelMetaSchema15(),
        offset: v.number(),
        ver: v.union([v.literal(18)]),
      }),
      editing: v.literal(true),
    }),
    v.object({
      cid: v.string(),
      lvIndex: v.number(),
      brief: v.object({
        ...ChartBriefSchema().entries,
        etag: v.string(),
      }),
      editing: v.literal(false),
    }),
  ]);
export type SessionData = v.InferOutput<ReturnType<typeof SessionDataSchema>>;

export function isQuotaExceededError(e: unknown): e is DOMException {
  // https://developer.mozilla.org/ja/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#localstorage_%E3%81%AE%E6%A9%9F%E8%83%BD%E6%A4%9C%E5%87%BA
  return (
    e instanceof DOMException &&
    // everything except Firefox
    (e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === "QuotaExceededError" ||
      // Firefox
      e.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

// プレイボタンを押した時にlocalStorageに保存し、sessionIdを返す
// share->play では押すたびにidを発行、edit->playでは使い回し
// localStorageのsessionは多くても1回しか呼ばれないので、容量節約のため定期的に消す
// (initSession時に過去のsessionをぜんぶ消すことにしている)
export function initSession(
  data: SessionData | null,
  sessionId?: number
): number {
  for (let si = 0; si < localStorage.length; si++) {
    if (localStorage.key(si)?.startsWith("session")) {
      localStorage.removeItem(localStorage.key(si) || "");
    }
  }

  if (sessionId === undefined) {
    sessionId = (Number(localStorage.getItem("lastSessionId")) || 0) + 1;
    localStorage.setItem("lastSessionId", String(sessionId));
  }
  localStorage.setItem(`session-${sessionId}`, JSON.stringify(data));
  return sessionId;
}
/**
 * sessionIdがあればlocalStorageからsessionを取得し、sessionStorageにも保存
 * なければsessionStorageから取得
 * それもなければnull
 *
 * エラーハンドリングはあえて行わず、 error.tsx に任せる。
 */
export function getSession(sessionId?: number): SessionData | null {
  // Discord等のアプリ内ブラウザからFirefoxに遷移すると、ユーザーに見えない隠しタブが
  // 同時にplayページを開くことがある。隠しタブが先にlocalStorageのsessionを読み出して
  // 削除すると、表示タブで「セッションを読み込めません」になるため、隠しタブ
  // (window.innerWidth === 0) では読み込みをスキップする。
  if (typeof window !== "undefined" && window.innerWidth === 0) {
    return null;
  }
  if (sessionId && localStorage.getItem(`session-${sessionId}`)) {
    const sessionData = v.parse(
      SessionDataSchema(),
      JSON.parse(localStorage.getItem(`session-${sessionId}`)!)
    );
    localStorage.removeItem(`session-${sessionId}`);
    sessionStorage.setItem("session", JSON.stringify(sessionData));
    return sessionData;
  }
  if (sessionStorage.getItem("session")) {
    return v.parse(
      SessionDataSchema(),
      JSON.parse(sessionStorage.getItem("session")!)
    );
  }
  return null;
}
