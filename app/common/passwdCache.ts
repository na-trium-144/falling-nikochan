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

export function setPasswd(cid: string, pw: string) {
  localStorage.setItem(passwdKey(cid), pw);
  localStorage.removeItem(v6PasswdKey(cid));
}
