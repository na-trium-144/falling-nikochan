import msgpack from "@ygoe/msgpack";

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
    params.judgeCount,
    params.bigCount,
  ]);
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
  const deserialized = msgpack.deserialize(serializedArr);
  if (deserialized[0] !== 1) {
    throw new Error("Invalid version");
  }
  return {
    date: new Date(dateBase.getTime() + deserialized[1]),
    lvName: deserialized[2],
    lvType: deserialized[3],
    lvDifficulty: deserialized[4],
    baseScore100: deserialized[5],
    chainScore100: deserialized[6],
    bigScore100: deserialized[7],
    score100: deserialized[8],
    judgeCount: deserialized[9],
    bigCount: deserialized[10],
  };
}
