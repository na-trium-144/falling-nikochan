import * as v from "valibot";

const versionKey = "lastVisited";
const latestChangelogMajor = 16;
const latestChangelogMinor = 19;
export function lastVisitedOld(): boolean {
  try {
    if (localStorage.getItem(versionKey)) {
      const [major, minor] = v.parse(
        v.tuple([v.number(), v.number()]),
        localStorage.getItem(versionKey)
      );
      return (
        major < latestChangelogMajor ||
        (major === latestChangelogMajor && minor < latestChangelogMinor)
      );
    }
  } catch (e) {
    console.error(
      `Error parsing ${versionKey}:`,
      v.isValiError(e) ? v.flatten(e.issues) : e
    );
  }
  return true;
}
export function updateLastVisited() {
  localStorage.setItem(
    versionKey,
    JSON.stringify([latestChangelogMajor, latestChangelogMinor])
  );
}
