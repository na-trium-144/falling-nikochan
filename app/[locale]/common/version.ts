const versionKey = "lastVisited";
function versionMajor() {
  return Number((process.env.buildVersion as string).split(".")[0]);
}
function versionMinor() {
  return Number((process.env.buildVersion as string).split(".")[1]);
}
export function lastVisitedOld(): boolean {
  try {
    const lastVisited = localStorage.getItem(versionKey);
    if (!lastVisited) {
      return true;
    }
    const [major, minor] = JSON.parse(lastVisited);
    return (
      major < versionMajor() ||
      (major === versionMajor() && minor < versionMinor())
    );
  } catch {
    return true;
  }
}
export function updateLastVisited() {
  localStorage.setItem(
    versionKey,
    JSON.stringify([versionMajor(), versionMinor()])
  );
}
