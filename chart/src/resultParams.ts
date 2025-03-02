import msgpack from "@ygoe/msgpack";

export interface ResultParams {
  date: number;
  lvIndex: number;
  baseScore: number;
  chainScore: number;
  bigScore: number;
  judgeCount: readonly [number, number, number, number];
  bigCount: number;
}
export function serializeResultParams(params: ResultParams): string {
  const serialized = msgpack.serialize([
    params.date,
    params.lvIndex,
    params.baseScore,
    params.chainScore,
    params.bigScore,
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
  const serializedBin = atob(serialized.replace("-", "+").replace("_", "/"));
  const serializedArr = new Uint8Array(serializedBin.length);
  for (let i = 0; i < serializedBin.length; i++) {
    serializedArr[i] = serializedBin.charCodeAt(i);
  }
  const deserialized = msgpack.deserialize(serializedArr);
  return {
    date: deserialized[0],
    lvIndex: deserialized[1],
    baseScore: deserialized[2],
    chainScore: deserialized[3],
    bigScore: deserialized[4],
    judgeCount: deserialized[5],
    bigCount: deserialized[6],
  };
}
