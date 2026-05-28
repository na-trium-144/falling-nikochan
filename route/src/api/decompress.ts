import { MiddlewareHandler } from "hono";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";

const supportedEncodings = ["identity", "gzip"] as const;
const acceptEncodingHeader = supportedEncodings.join(", ");
const gunzipAsync = promisify(gunzip);
const isSupportedEncoding = (
  value: string
): value is (typeof supportedEncodings)[number] =>
  supportedEncodings.some((encoding) => encoding === value);

const decompressMiddleware: MiddlewareHandler = async (c, next) => {
  // This middleware must run before any handler/middleware that consumes c.req body.
  const contentEncoding = c.req.header("content-encoding");
  if (!contentEncoding) {
    await next();
    return;
  }

  const encodings = contentEncoding
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter((v) => v.length > 0);
  if (
    encodings.length === 0 ||
    encodings.some((v) => !isSupportedEncoding(v))
  ) {
    return c.json(
      { message: "unsupportedContentEncoding" },
      415,
      { "Accept-Encoding": acceptEncodingHeader }
    );
  }

  if (!encodings.includes("gzip")) {
    await next();
    return;
  }

  // Read from raw request so Hono bodyCache does not retain compressed payload.
  let bodyBuffer = Buffer.from(await c.req.raw.arrayBuffer());
  try {
    // Content-Encoding is listed in the order applied, so decode in reverse order.
    for (const encoding of encodings.toReversed()) {
      if (encoding === "identity") {
        continue;
      }
      bodyBuffer = await gunzipAsync(bodyBuffer);
    }
  } catch {
    return c.json(
      { message: "invalidContentEncoding" },
      415,
      { "Accept-Encoding": acceptEncodingHeader }
    );
  }

  const headers = new Headers(c.req.raw.headers);
  headers.delete("content-encoding");
  headers.set("content-length", bodyBuffer.byteLength.toString());
  c.req.raw = new Request(c.req.raw, {
    body: bodyBuffer,
    headers,
  });
  await next();
};

export default decompressMiddleware;
