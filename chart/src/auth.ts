import * as v from "valibot";
import * as msgpack from "@msgpack/msgpack";
import { ResultSerializedSchema } from "./resultParams.js";

// Example / test keypair for ResultSecret
export const DEFAULT_RESULT_SECRET_PUBLIC_KEY =
  "BEwor3T-tZzbpw1lVlr4FX225EzNGGq1wLrPM-frNhu_V7Qkx1k9wcArqSJFBMdwwQ-89N4dV7rNI6AygSIXb6I";
export const DEFAULT_DEV_RESULT_SECRET_PRIVATE_KEY =
  "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgBTprjvGEw5NxQyMEH1mJo-0VWkElb21JYf7PJdimK82hRANCAARMKK90_rWc26cNZVZa-BV9tuRMzRhqtcC6zzPn6zYbv1e0JMdZPcHAK6kiRQTHcMEPvPTeHVe6zSOgMoEiF2-i";

export function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function base64UrlToBytes(str: string): Uint8Array {
  let base64 = str.replaceAll("-", "+").replaceAll("_", "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

export async function generateKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  privateKeyStr: string;
  publicKeyStr: string;
}> {
  const keyPair = (await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  )) as CryptoKeyPair;

  const pubRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", keyPair.publicKey)
  );
  const privPkcs8 = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
  );

  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    privateKeyStr: bytesToBase64Url(privPkcs8),
    publicKeyStr: bytesToBase64Url(pubRaw),
  };
}

export async function importPublicKey(
  publicKeyStr: string
): Promise<CryptoKey> {
  const keyData = base64UrlToBytes(publicKeyStr);
  return await crypto.subtle.importKey(
    "raw",
    keyData as unknown as BufferSource,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );
}

export async function importPrivateKey(
  privateKeyStr: string
): Promise<CryptoKey> {
  const keyData = base64UrlToBytes(privateKeyStr);
  return await crypto.subtle.importKey(
    "pkcs8",
    keyData as unknown as BufferSource,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );
}

export async function signData(
  privateKey: CryptoKey | string,
  data: Uint8Array | string
): Promise<string> {
  const key =
    typeof privateKey === "string"
      ? await importPrivateKey(privateKey)
      : privateKey;
  const dataBytes =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    key,
    dataBytes as unknown as BufferSource
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function verifyData(
  publicKey: CryptoKey | string,
  signatureStr: string,
  data: Uint8Array | string
): Promise<boolean> {
  try {
    const key =
      typeof publicKey === "string"
        ? await importPublicKey(publicKey)
        : publicKey;
    const signatureBytes = base64UrlToBytes(signatureStr);
    const dataBytes =
      typeof data === "string" ? new TextEncoder().encode(data) : data;
    return await crypto.subtle.verify(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      key,
      signatureBytes as unknown as BufferSource,
      dataBytes as unknown as BufferSource
    );
  } catch {
    return false;
  }
}

/**
 * Verify a resultParam string and its optional signature with ResultSecret.
 * - For ver 1, 2, 3: signature is optional (returns true without signature).
 * - For ver 4: signature is required and must be validly signed with ResultSecret.
 */
export async function verifyResultParam(
  resultParamStr: string,
  signatureStr: string | null | undefined,
  resultSecretPublicKey: CryptoKey | string
): Promise<boolean> {
  try {
    const serializedBin = atob(
      resultParamStr.replaceAll("-", "+").replaceAll("_", "/")
    );
    const serializedArr = new Uint8Array(serializedBin.length);
    for (let i = 0; i < serializedBin.length; i++) {
      serializedArr[i] = serializedBin.charCodeAt(i);
    }
    const decoded = msgpack.decode(serializedArr);
    const parsed = v.parse(ResultSerializedSchema(), decoded);

    if (parsed[0] === 4) {
      if (!signatureStr) {
        return false;
      }
      return await verifyData(
        resultSecretPublicKey,
        signatureStr,
        serializedArr
      );
    } else {
      // ver 1, 2, 3: no signature required for backwards compatibility
      return true;
    }
  } catch {
    return false;
  }
}
