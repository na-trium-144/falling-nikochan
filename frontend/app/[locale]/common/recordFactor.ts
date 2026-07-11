import * as v from "valibot";

const key = "oldPlayRecords";
const RecordSchema = () =>
  v.object({
    cid: v.string(),
    lvHash: v.string(),
    auto: v.boolean(),
    at: v.number(),
  });
type Record = v.InferOutput<ReturnType<typeof RecordSchema>>;

export function updateRecordFactor(
  cid: string | undefined,
  lvHash: string,
  auto: boolean
) {
  if (!cid) {
    return 1;
  }
  let records: Record[] = [];
  try {
    records = v.parse(
      v.array(RecordSchema()),
      JSON.parse(localStorage.getItem(key) || "[]")
    );
  } catch (e) {
    console.error(
      `Error parsing ${key}:`,
      v.isValiError(e) ? v.flatten(e.issues) : e
    );
  }
  records.push({ cid, lvHash, auto, at: Date.now() });
  records = records.filter((r) => r.at > Date.now() - 1000 * 60 * 60 * 24 * 1);
  localStorage.setItem(key, JSON.stringify(records));
  const numPlay = records.filter(
    (r) => r.cid === cid && r.lvHash === lvHash && r.auto === auto
  ).length;
  return 1 / numPlay;
}
