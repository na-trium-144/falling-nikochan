import msgpack from "@ygoe/msgpack";
import * as v from "valibot";

const dateBase = new Date(2025, 2, 1);
export interface ResultParams {
  date: Date;
  lvName: string;
  lvType: number;
  lvDifficulty: number;
  // 100倍して整数にすることでサイズを削減
  baseScore100: number;
  chainScore100: number;
  bigScore100: number;
  score100: number;
  judgeCount: readonly [number, number, number, number];
  bigCount: number;
}
// ここではレベルの指定はlvIndexやlvHashではなく、名前と内容を直接保存しているので
// レベルの順番が変わったり更新されたりしても記録は有効
export const ResultSerializedSchema = () =>
  v.tuple([
    v.literal(1),
    v.number(), // [1] date - dateBase
    v.string(), // [2] lvName
    v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2)), // [3] lvType 0,1,2
    v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(20)), // [4] lvDifficulty 0-20
    v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(8000)), // [5] baseScore100
    v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2000)), // [6] chainScore100
    v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2000)), // [7] bigScore100
    v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(12000)), // [8] score100
    v.pipe(v.array(v.pipe(v.number(), v.integer())), v.length(4)), // [9] judgeCount
    v.pipe(v.number(), v.integer(), v.minValue(0)), // [10] bigCount
  ]);
export type ResultSerialized = v.InferOutput<
  ReturnType<typeof ResultSerializedSchema>
>;
export function serializeResultParams(params: ResultParams): string {
  const serialized = msgpack.serialize([
    1,
    params.date.getTime() - dateBase.getTime(),
    params.lvName,
    params.lvType,
    params.lvDifficulty,
    params.baseScore100,
    params.chainScore100,
    params.bigScore100,
    params.score100,
    params.judgeCount.slice(),
    params.bigCount,
  ] satisfies ResultSerialized);
  let serializedBin = "";
  for (let i = 0; i < serialized.length; i++) {
    serializedBin += String.fromCharCode(serialized[i]);
  }
  return btoa(serializedBin)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
export function deserializeResultParams(serialized: string): ResultParams {
  const serializedBin = atob(
    serialized.replaceAll("-", "+").replaceAll("_", "/"),
  );
  const serializedArr = new Uint8Array(serializedBin.length);
  for (let i = 0; i < serializedBin.length; i++) {
    serializedArr[i] = serializedBin.charCodeAt(i);
  }
  const deserialized = msgpack.deserialize(serializedArr);
  if (deserialized[0] !== 1) {
    throw new Error("Invalid version");
  }
  const validated = v.parse(ResultSerializedSchema(), deserialized);
  return {
    date: new Date(dateBase.getTime() + validated[1]),
    lvName: validated[2],
    lvType: validated[3],
    lvDifficulty: validated[4],
    baseScore100: validated[5],
    chainScore100: validated[6],
    bigScore100: validated[7],
    score100: validated[8],
    judgeCount: validated[9] as [number, number, number, number],
    bigCount: validated[10],
  };
}
