const key = "numPlay";
interface Record {
  cid: string;
  lvHash: string;
  auto: boolean;
  at: number;
}
export function updateRecordFactor(
  cid: string | undefined,
  lvHash: string,
  auto: boolean
) {
  if (!cid) {
    return 1;
  }
  let records: Record[] = JSON.parse(localStorage.getItem(key) || "[]");
  records.push({ cid, lvHash, auto, at: Date.now() });
  records = records.filter((r) => r.at > Date.now() - 1000 * 60 * 60 * 24 * 1);
  localStorage.setItem(key, JSON.stringify(records));
  const numPlay = records.filter(
    (r) => r.cid === cid && r.lvHash === lvHash && r.auto === auto
  ).length;
  return 1 / numPlay;
}
