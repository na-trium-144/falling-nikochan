import { captureAndWrap, fetchBackend } from "@/common/fetch";
import { RecordPost } from "@falling-nikochan/chart";
import { sign } from "hono/jwt";
import {
  decodeBase64,
  decodeBase64Url,
  encodeBase64Url,
} from "hono/utils/encode";

async function buildPrivKey() {
  return crypto.subtle.importKey(
    "pkcs8",
    resultBuildPrivPkcs8,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
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

export async function initResultSigning(
  cid: string,
  setResultSessionKeyPair: (key: CryptoKeyPair) => void,
  setResultSessionToken: (token: string) => void
) {
  const sessionKeyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
  const buildToken = await sign(
    {
      key: await crypto.subtle.exportKey("jwk", sessionKeyPair.publicKey),
      cid,
    },
    await buildPrivKey(),
    "ES256"
  );
  return fetchBackend()
    .url("/api/resultSigning/init")
    .body(buildToken)
    .post()
    .text((token) => {
      setResultSessionKeyPair(sessionKeyPair);
      setResultSessionToken(token);
    });
}

export async function sendRecord(
  cid: string,
  record: RecordPost,
  sessionKeyPair: CryptoKeyPair,
  resultSessionToken: string
) {
  const recordSigned = await sign(
    record as Record<string, unknown>,
    sessionKeyPair.privateKey,
    "ES256"
  );
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
  sessionKeyPair: CryptoKeyPair,
  resultSessionToken: string,
  setSign: (sign: string) => void
) {
  const clientSign = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    sessionKeyPair.privateKey,
    decodeBase64Url(resultSerialized)
  );
  return fetchBackend()
    .url("/api/resultSigning/sign")
    .json({
      result: resultSerialized,
      clientSign: encodeBase64Url(clientSign).replaceAll("=", ""),
    })
    .headers({ Authorization: `Bearer ${resultSessionToken}` })
    .post()
    .notFound(() => undefined)
    .error(429, () => undefined)
    .json(({ sign }) => setSign(sign))
    .catch((e: unknown) => captureAndWrap(e));
}

// defined with DefinePlugin in next.config.mjs
declare const RESULT_BUILD_PRIVATE_PKCS8_BASE64: string;
// インラインで書かない・呼び出し元から離す ことで読みづらくする
const resultBuildPrivPkcs8Base64 = RESULT_BUILD_PRIVATE_PKCS8_BASE64;
const resultBuildPrivPkcs8 = decodeBase64(resultBuildPrivPkcs8Base64);
