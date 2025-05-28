import msgpack from "@ygoe/msgpack";
import * as v from "valibot";

const dateBase = new Date(2025, 2, 1);
export interface ResultParams {
  date: Date | null;
  lvName: string;
  lvType: number;
  lvDifficulty: number;
  // 100倍して整数にすることでサイズを削減
  baseScore100: number;
  chainScore100: number;
  bigScore100: number;
  score100: number;
  judgeCount: readonly [number, number, number, number];
  bigCount: number | null; // null: 存在しない
  inputType: number | null;
}
export const inputTypes = {
  keyboard: 1,
  touch: 2,
  mouse: 3,
  pen: 4,
  gamepad: 5,
} as const;
// ここではレベルの指定はlvIndexやlvHashではなく、名前と難易度表記を直接保存しているので
// レベルの順番が変わったり更新されたりしても記録は有効
export const ResultSerializedSchema = () =>
  v.union([
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
      v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0))), // [10] bigCount
    ]),
    v.tuple([
      v.literal(2),
      v.nullable(v.number()), // [1] date - dateBase
      v.string(), // [2] lvName
      v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2)), // [3] lvType 0,1,2
      v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(20)), // [4] lvDifficulty 0-20
      v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(8000)), // [5] baseScore100
      v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2000)), // [6] chainScore100
      v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2000)), // [7] bigScore100
      v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(12000)), // [8] score100
      v.pipe(v.array(v.pipe(v.number(), v.integer())), v.length(4)), // [9] judgeCount
      v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0))), // [10] bigCount
      v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1))), // [11] inputType
    ]),
  ]);
export type ResultSerialized = v.InferOutput<
  ReturnType<typeof ResultSerializedSchema>
>;
export function serializeResultParams(params: ResultParams): string {
  const serialized = msgpack.serialize([
    2,
    params.date !== null ? params.date.getTime() - dateBase.getTime() : null,
    params.lvName,
    params.lvType,
    params.lvDifficulty,
    params.baseScore100,
    params.chainScore100,
    params.bigScore100,
    params.score100,
    params.judgeCount.slice(),
    params.bigCount,
    params.inputType,
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
    serialized.replaceAll("-", "+").replaceAll("_", "/")
  );
  const serializedArr = new Uint8Array(serializedBin.length);
  for (let i = 0; i < serializedBin.length; i++) {
    serializedArr[i] = serializedBin.charCodeAt(i);
  }
  const deserialized = v.parse(
    ResultSerializedSchema(),
    msgpack.deserialize(serializedArr)
  );
  switch (deserialized[0]) {
    case 1:
    case 2:
      return {
        date:
          deserialized[1] !== null
            ? new Date(dateBase.getTime() + deserialized[1])
            : null,
        lvName: deserialized[2],
        lvType: deserialized[3],
        lvDifficulty: deserialized[4],
        baseScore100: deserialized[5],
        chainScore100: deserialized[6],
        bigScore100: deserialized[7],
        score100: deserialized[8],
        judgeCount: deserialized[9] as [number, number, number, number],
        bigCount: deserialized[10],
        inputType: deserialized[11] || null,
      };
    default:
      throw new Error("Invalid version");
  }
}
