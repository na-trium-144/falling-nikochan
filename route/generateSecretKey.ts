import { Buffer } from "node:buffer";

const key = await crypto.subtle.generateKey(
  { name: "HMAC", hash: { name: "SHA-256" } },
  true,
  ["sign", "verify"]
);

console.log(
  "RESULT_SECRET_KEY=",
  Buffer.from(await crypto.subtle.exportKey("raw", key)).toString("base64url")
);
