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

  const gzipCount = encodings.filter((v) => v === "gzip").length;
  if (gzipCount === 0) {
    await next();
    return;
  }

  let body = Buffer.from(await c.req.arrayBuffer());
  try {
    for (let i = 0; i < gzipCount; i++) {
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
  headers.delete("content-length");
  c.req.raw = new Request(c.req.raw, {
    body,
    headers,
  });
  c.req.bodyCache = {};
  await next();
};

export default decompressMiddleware;
