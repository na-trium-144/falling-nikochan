import { HTTPException } from "hono/http-exception";

interface PasswdParams {
  p?: string;
  ph?: string;
  pbypass?: string;
}

function decodeBase64Utf8(value: string): string {
  const bin = atob(value);
  return new TextDecoder().decode(
    Uint8Array.from(bin, (char) => char.codePointAt(0) ?? 0)
  );
}

export function getPasswdParamsFromAuthHeader(
  authorization: string | undefined,
  fallback: PasswdParams
): PasswdParams {
  if (!authorization) {
    return fallback;
  }
  if (authorization.startsWith("Nikochan-Basic ")) {
    let p: string;
    try {
      p = decodeBase64Utf8(authorization.slice("Nikochan-Basic ".length));
    } catch {
      throw new HTTPException(400, { message: "invalidAuthorization" });
    }
    if (p.length === 0) {
      throw new HTTPException(400, { message: "invalidAuthorization" });
    }
    return { p };
  }
  if (authorization.startsWith("Nikochan-Hash ")) {
    return { ph: authorization.slice("Nikochan-Hash ".length) };
  }
  if (authorization.startsWith("Nikochan-Bypass ")) {
    return { pbypass: authorization.slice("Nikochan-Bypass ".length) };
  }
  if (authorization.startsWith("Nikochan-")) {
    throw new HTTPException(400, { message: "invalidAuthorization" });
  }
  return fallback;
}
