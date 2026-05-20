import { HTTPException } from "hono/http-exception";

interface PasswdParams {
  p?: string;
  ph?: string;
  pbypass?: string;
}

function decodeBase64Utf8(value: string): string {
  let bin: string;
  try {
    bin = atob(value);
  } catch {
    throw new HTTPException(400, {
      message: "malformedBase64InAuthorizationHeader",
    });
  }
  return new TextDecoder().decode(
    Uint8Array.from(bin, (char) => char.charCodeAt(0))
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
    const p = decodeBase64Utf8(authorization.slice("Nikochan-Basic ".length));
    if (p.length === 0) {
      throw new HTTPException(400, { message: "emptyPasswordInAuthorization" });
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
