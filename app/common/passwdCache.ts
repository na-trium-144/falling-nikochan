function passwdKey(cid: string) {
  return "pass-" + cid;
}
export function getPasswd(cid: string): string {
  return localStorage.getItem(passwdKey(cid)) || "";
}

export function setPasswd(cid: string, pw: string) {
  localStorage.setItem(passwdKey(cid), pw);
}
