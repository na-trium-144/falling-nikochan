import msgpack from "@ygoe/msgpack";

export interface ResultParams {
  lang: string;
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
    params.lang,
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
    .replace("+", "-")
    .replace("/", "_")
    .replace("=", "");
}
export function deserializeResultParams(serialized: string): ResultParams {
  const serializedBin = atob(serialized.replace("-", "+").replace("_", "/"));
  const serializedArr = new Uint8Array(serializedBin.length);
  for (let i = 0; i < serializedBin.length; i++) {
    serializedArr[i] = serializedBin.charCodeAt(i);
  }
  const deserialized = msgpack.deserialize(serializedArr);
  return {
    lang: deserialized[0],
    date: deserialized[1],
    lvIndex: deserialized[2],
    baseScore: deserialized[3],
    chainScore: deserialized[4],
    bigScore: deserialized[5],
    judgeCount: deserialized[6],
    bigCount: deserialized[7],
  };
}
