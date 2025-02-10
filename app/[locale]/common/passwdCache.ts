function v6PasswdKey(cid: string) {
  return "pass-" + cid;
}
function passwdKey(cid: string) {
  return "ph-" + cid;
}
export function getV6Passwd(cid: string): string {
  return localStorage.getItem(v6PasswdKey(cid)) || "";
}
export function getPasswd(cid: string): string {
  return localStorage.getItem(passwdKey(cid)) || "";
}
export function preferSavePasswd(): boolean {
  return !!Number(localStorage.getItem("preferSavePasswd"));
}

export function setPasswd(cid: string, pw: string) {
  localStorage.setItem(passwdKey(cid), pw);
  localStorage.removeItem(v6PasswdKey(cid));
  localStorage.setItem("preferSavePasswd", "1");
}
export function unsetPasswd(cid: string) {
  localStorage.removeItem(passwdKey(cid));
  localStorage.removeItem(v6PasswdKey(cid));
  localStorage.setItem("preferSavePasswd", "0");
}
