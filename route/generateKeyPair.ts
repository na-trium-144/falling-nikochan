const keyPair = (await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"]
)) as CryptoKeyPair;

console.log(
  "RESULT_SECRET_PUBLIC_KEY=",
  Buffer.from(await crypto.subtle.exportKey("raw", keyPair.publicKey)).toString(
    "base64url"
  )
);
console.log(
  "RESULT_SECRET_PRIVATE_KEY=",
  Buffer.from(
    await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
  ).toString("base64url")
);

export {};
