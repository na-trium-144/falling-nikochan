export function getRecentEdit(): string[] {
  try {
    const items = JSON.parse(localStorage.getItem("editRecent") || "");
    if (Array.isArray(items) && items.every((b) => typeof b === "string")) {
      return items;
    }
  } catch {}
  return [];
}

export function addRecentEdit(cid: string) {
  const newRecent = getRecentEdit();
  if (newRecent.indexOf(cid) < 0) {
    newRecent.push(cid);
    localStorage.setItem("editRecent", JSON.stringify(newRecent));
  }
}
export function removeRecentEdit(cid: string) {
  const recent = getRecentEdit();
  if (recent.indexOf(cid) >= 0) {
    recent.push(cid);
    localStorage.setItem(
      "editRecent",
      JSON.stringify(recent.filter((oldCid) => oldCid !== cid))
    );
  }
}
