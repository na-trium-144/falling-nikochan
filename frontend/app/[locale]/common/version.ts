const versionKey = "lastVisited";
const latestChangelogMajor = 12;
const latestChangelogMinor = 44;
export function lastVisitedOld(): boolean {
  try {
    const lastVisited = localStorage.getItem(versionKey);
    if (!lastVisited) {
      return true;
    }
    const [major, minor] = JSON.parse(lastVisited);
    return (
      major < latestChangelogMajor ||
      (major === latestChangelogMajor && minor < latestChangelogMinor)
    );
  } catch {
    return true;
  }
}
export function updateLastVisited() {
  localStorage.setItem(
    versionKey,
    JSON.stringify([latestChangelogMajor, latestChangelogMinor])
  );
}
