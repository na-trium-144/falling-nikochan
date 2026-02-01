/*
playページの隠しオプションとしてのクエリパラメーター
case insensitive で処理する。
boolean値については、 0, 空文字, 未指定 をfalse、それ以外をtrueにする
*/
export interface QueryOptions {
  // session idで譜面を指定
  sid?: number;
  // sidの代わりにcidとlvIndexで譜面を指定することも可能
  cid?: string;
  lvIndex?: number;

  fps?: boolean; // fps表示
  speed?: boolean; // 音符の速度変化を表示 (ver13以降のなめらか速度変化に対応していません)
  result?: boolean; // ページを開いた直後にダミーのリザルト画面に遷移する
  auto?: boolean; // オートプレイをデフォルトにする
  judgeAuto?: boolean; // オートプレイ時にもユーザーのプレイと同じ判定を適用する (ver12.21〜13.20の動作)
  noClear?: boolean; // 停止時に音符を消さない
  tsOffset?: boolean; // リアルタイムにオフセットを表示
  seek?: boolean; // オートプレイ時に5秒送り/5秒戻しができるようになる(音符の挙動がバグっぽいので隠し機能にしている)
}
function toBoolean(value: string | null): boolean {
  return !(value === null || value === "0" || value === "");
}
export function getQueryOptions(): QueryOptions {
  const q = new URLSearchParams(
    Array.from(new URLSearchParams(window.location.search).entries()).map(
      ([k, v]) => [k.toLowerCase(), v]
    )
  );
  return {
    sid: q.has("sid") ? Number(q.get("sid")) : undefined,
    cid: q.get("cid") ?? undefined,
    lvIndex: q.has("lvindex") ? Number(q.get("lvindex")) : undefined,
    fps: toBoolean(q.get("fps")),
    speed: toBoolean(q.get("speed")),
    result: toBoolean(q.get("result")),
    auto: toBoolean(q.get("auto")),
    judgeAuto: toBoolean(q.get("judgeauto")),
    noClear: toBoolean(q.get("noclear")),
    tsOffset: toBoolean(q.get("tsoffset")),
    seek: toBoolean(q.get("seek")),
  };
}
