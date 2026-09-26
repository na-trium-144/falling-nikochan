import { captureAndWrap, fetchBackend } from "@/common/fetch";
import { RecordPost } from "@falling-nikochan/chart";
import { p256 } from "@noble/curves/nist.js";
import {
  decodeBase64,
  decodeBase64Url,
  encodeBase64Url,
} from "hono/utils/encode";
import { utf8Encoder } from "hono/utils/jwt/utf8";
import type { SignatureAlgorithm } from "hono/utils/jwt/jwa";
import type { TokenHeader } from "hono/utils/jwt/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";

function encodeUint8ArrayToBase64Url(bytes: Uint8Array): string {
  return encodeBase64Url(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  ).replaceAll("=", "");
}

// gnirtsの生成するコードはtoString()やfromCharCode()などの関数の繰り返しが多いので、
// webpackがこれらを復元せず最適化できるよう、関数に切り出したり表現を置き換える
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _charCodeAt0 = (c: string) => "".charCodeAt.call(c, 0);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _fromCharCode = (c: number) => String.fromCharCode.apply(null, [c]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _arraySlice = (a: unknown[]) => Array.prototype.slice.call(a);
const _toString = (c: number, r: number) => c.toString(r);
const _toString36LowerCase = (c: number) =>
  _toString.call(null, c, 36).toLowerCase();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _toString36LowerCaseSplit = (c: number) =>
  _toString36LowerCase(c).split("");

function p256PublicKeyToJwk(publicKey: Uint8Array) {
  return {
    kty: "EC",
    crv: "P-256",
    x: encodeUint8ArrayToBase64Url(publicKey.subarray(1, 33)),
    y: encodeUint8ArrayToBase64Url(publicKey.subarray(33, 65)),
  } satisfies JsonWebKey;
}

function signJwt(
  payload: JWTPayload,
  privateKey: Uint8Array,
  alg: SignatureAlgorithm,
  sign: typeof p256.sign
): string {
  const encodedHeader = encodeUint8ArrayToBase64Url(
    utf8Encoder.encode(JSON.stringify({ alg } satisfies TokenHeader))
  );
  const encodedPayload = encodeUint8ArrayToBase64Url(
    utf8Encoder.encode(JSON.stringify(payload))
  );
  const partialToken = `${encodedHeader}.${encodedPayload}`;
  const sig = sign(utf8Encoder.encode(partialToken), privateKey);
  const signature = encodeUint8ArrayToBase64Url(sig);
  return `${partialToken}.${signature}`;
}

export async function initResultSigning(
  cid: string,
  setResultSessionPrivateKey: (key: Uint8Array) => void,
  setResultSessionToken: (token: string) => void
) {
  const privateKey = p256.utils.randomSecretKey();
  const publicKey = p256PublicKeyToJwk(p256.getPublicKey(privateKey, false));
  const buildToken = signJwt(
    { key: publicKey, cid },
    resultBuildPrivKey,
    "ES256",
    p256.sign
  );
  return fetchBackend()
    .url("/api/resultSigning/init")
    .body(buildToken)
    .post()
    .text((token) => {
      setResultSessionPrivateKey(privateKey);
      setResultSessionToken(token);
    });
}

export async function sendRecord(
  cid: string,
  record: RecordPost,
  sessionPrivateKey: Uint8Array,
  resultSessionToken: string
) {
  const recordSigned = signJwt(record, sessionPrivateKey, "ES256", p256.sign);
  return fetchBackend()
    .url(`/api/record/${cid}`)
    .body(recordSigned)
    .headers({ Authorization: `Bearer ${resultSessionToken}` })
    .post()
    .notFound(() => undefined)
    .error(429, () => undefined)
    .res()
    .catch((e: unknown) => captureAndWrap(e, { cid }));
}
export async function sendResultSerialized(
  resultSerialized: string,
  sessionPrivateKey: Uint8Array,
  resultSessionToken: string,
  setSign: (sign: string) => void
) {
  const clientSign = p256.sign(
    decodeBase64Url(resultSerialized),
    sessionPrivateKey
  );
  return fetchBackend()
    .url("/api/resultSigning/sign")
    .json({
      result: resultSerialized,
      clientSign: encodeUint8ArrayToBase64Url(clientSign),
    })
    .headers({ Authorization: `Bearer ${resultSessionToken}` })
    .post()
    .notFound(() => undefined)
    .error(429, () => undefined)
    .json(({ sign }) => setSign(sign))
    .catch((e: unknown) => captureAndWrap(e));
}

// defined with DefinePlugin in next.config.mjs
declare const RESULT_BUILD_PRIVATE_BASE64: string;
// インラインで書かない・呼び出し元から離す ことで読みづらくする
const resultBuildPrivKeyBase64 = RESULT_BUILD_PRIVATE_BASE64;
const resultBuildPrivKey = decodeBase64(resultBuildPrivKeyBase64);
