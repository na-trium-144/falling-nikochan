import { HashSchema } from "@falling-nikochan/chart";
import * as v from "valibot";

function passwdKey(cid: string) {
  return "ph-" + cid;
}
export function getPasswd(cid: string): string | null {
  try {
    return v.parse(HashSchema(), localStorage.getItem(passwdKey(cid)));
  } catch {
    return null;
  }
}
export function preferSavePasswd(): boolean {
  return !!Number(localStorage.getItem("preferSavePasswd"));
}

export function setPasswd(cid: string, pw: string) {
  localStorage.setItem(passwdKey(cid), pw);
  localStorage.setItem("preferSavePasswd", "1");
}
export function unsetPasswd(cid: string) {
  localStorage.removeItem(passwdKey(cid));
  localStorage.setItem("preferSavePasswd", "0");
}
