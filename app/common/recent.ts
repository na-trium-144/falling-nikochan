function recentKey(key: string) {
  return "recent-" + key;
}
export function getRecent(key: string): string[] {
  try {
    const items = JSON.parse(localStorage.getItem(recentKey(key)) || "");
    if (Array.isArray(items) && items.every((b) => typeof b === "string")) {
      return items;
    }
  } catch {}
  return [];
}

export function addRecent(key: string, cid: string) {
  const newRecent = getRecent(key);
  if (newRecent.indexOf(cid) < 0) {
    newRecent.push(cid);
    localStorage.setItem(recentKey(key), JSON.stringify(newRecent));
  }
}
export function removeRecent(key: string, cid: string) {
  const recent = getRecent(key);
  if (recent.indexOf(cid) >= 0) {
    recent.push(cid);
    localStorage.setItem(
      recentKey(key),
      JSON.stringify(recent.filter((oldCid) => oldCid !== cid))
    );
  }
}
