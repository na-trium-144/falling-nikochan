import { CidSchema } from "@falling-nikochan/chart";
import * as v from "valibot";

export function recentKey(key: string) {
  return "recent-" + key;
}
export function getRecent(key: string): string[] {
  try {
    if (localStorage.getItem(recentKey(key))) {
      return v.parse(
        v.array(CidSchema()),
        JSON.parse(localStorage.getItem(recentKey(key))!)
      );
    }
  } catch {
    //
  }
  return [];
}

export function addRecent(key: string, cid: string) {
  let newRecent = getRecent(key);
  if (newRecent.indexOf(cid) >= 0) {
    newRecent = newRecent.filter((oldCid) => oldCid !== cid);
  }
  // リストの最後に追加する
  newRecent.push(cid);
  localStorage.setItem(recentKey(key), JSON.stringify(newRecent));
}
export function updateRecent(key: string, cids: string[]) {
  localStorage.setItem(recentKey(key), JSON.stringify(cids));
}
export function removeRecent(key: string, cid: string) {
  const recent = getRecent(key);
  if (recent.indexOf(cid) >= 0) {
    localStorage.setItem(
      recentKey(key),
      JSON.stringify(recent.filter((oldCid) => oldCid !== cid))
    );
  }
}
