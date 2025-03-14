function passwdKey(cid: string) {
  return "ph-" + cid;
}
export function getPasswd(cid: string): string | null {
  return localStorage.getItem(passwdKey(cid));
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
