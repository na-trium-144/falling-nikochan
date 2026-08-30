import { captureAndWrap, fetchBackend } from "@/common/fetch";
import { RecordPost } from "@falling-nikochan/chart";
import { sign } from "hono/jwt";
import { decodeBase64Url, encodeBase64Url } from "hono/utils/encode";

export async function initPlaySession(
  cid: string,
  setPlaySessionKeyPair: (key: CryptoKeyPair) => void,
  setPlaySessionToken: (token: string) => void
) {
  const sessionKeyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
  const buildPrivKey = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(process.env.RESULT_BUILD_PRIVATE_JWK!),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );
  const buildToken = await sign(
    {
      key: await crypto.subtle.exportKey("jwk", sessionKeyPair.publicKey),
      cid,
    },
    buildPrivKey,
    "ES256"
  );
  return fetchBackend()
    .url("/api/playSession/init")
    .body(buildToken)
    .post()
    .text((token) => {
      setPlaySessionKeyPair(sessionKeyPair);
      setPlaySessionToken(token);
    });
}

export async function sendRecord(
  cid: string,
  record: RecordPost,
  sessionKeyPair: CryptoKeyPair,
  playSessionToken: string
) {
  const recordSigned = await sign(
    record as Record<string, unknown>,
    sessionKeyPair.privateKey,
    "ES256"
  );
  return fetchBackend()
    .url(`/api/record/${cid}`)
    .body(recordSigned)
    .headers({ Authorization: `Bearer ${playSessionToken}` })
    .post()
    .notFound(() => undefined)
    .error(429, () => undefined)
    .res()
    .catch((e: unknown) => captureAndWrap(e, { cid }));
}
export async function sendResultSerialized(
  resultSerialized: string,
  sessionKeyPair: CryptoKeyPair,
  playSessionToken: string,
  setSign: (sign: string) => void
) {
  const clientSign = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    sessionKeyPair.publicKey,
    decodeBase64Url(resultSerialized)
  );
  return fetchBackend()
    .url("/api/playSession/sign")
    .json({
      result: resultSerialized,
      clientSign: encodeBase64Url(clientSign),
    })
    .headers({ Authorization: `Bearer ${playSessionToken}` })
    .post()
    .notFound(() => undefined)
    .error(429, () => undefined)
    .json(({ sign }) => setSign(sign))
    .catch((e: unknown) => captureAndWrap(e));
}
