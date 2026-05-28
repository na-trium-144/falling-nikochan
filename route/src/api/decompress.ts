import { MiddlewareHandler } from "hono";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";

const supportedEncodings = ["identity", "gzip"] as const;
const acceptEncodingHeader = supportedEncodings.join(", ");
const gunzipAsync = promisify(gunzip);

const decompressMiddleware: MiddlewareHandler = async (c, next) => {
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
    encodings.some((v) => !supportedEncodings.includes(v as "identity" | "gzip"))
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
  let body = Buffer.from(await c.req.raw.arrayBuffer());
  try {
    // Content-Encoding is listed in the order applied, so decode in reverse order.
    for (const encoding of encodings.toReversed()) {
      if (encoding === "identity") {
        continue;
      }
      body = await gunzipAsync(body);
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
  headers.set("content-length", body.byteLength.toString());
  c.req.raw = new Request(c.req.raw, {
    body,
    headers,
  });
  await next();
};

export default decompressMiddleware;
