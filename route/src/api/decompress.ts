import { createMiddleware } from "hono/factory";
import { Blob } from "node:buffer";
import { DecompressionStream } from "node:stream/web";

const supportedEncodings = ["gzip"] as const;

const decompressMiddleware = createMiddleware(async (c, next) => {
  // This middleware must run before any handler/middleware that consumes c.req body.
  const contentEncoding = c.req.header("content-encoding");
  if (!contentEncoding) {
    return next();
  }

  const encodings = contentEncoding
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  // 今回サポートするのは gzip のみ
  if (
    encodings.length === 0 ||
    encodings.some(
      (v) => !(supportedEncodings as readonly string[]).includes(v)
    )
  ) {
    return c.json({ message: "unsupportedContentEncoding" }, 415, {
      "Accept-Encoding": supportedEncodings.join(", "),
    });
  }

  // Read from raw request so Hono bodyCache does not retain compressed payload.
  let bodyBuffer = Buffer.from(await c.req.raw.arrayBuffer());

  try {
    // Content-Encoding is listed in the order applied, so decode in reverse order.
    for (const encoding of encodings.toReversed()) {
      switch (encoding) {
        case "gzip":
          bodyBuffer = Buffer.from(
            await new Response(
              new Blob([bodyBuffer])
                .stream()
                .pipeThrough(new DecompressionStream("gzip"))
            ).arrayBuffer()
          );
          break;
      }
    }
  } catch {
    return c.json({ message: "invalidContentEncoding" }, 415, {
      "Accept-Encoding": supportedEncodings.join(", "),
    });
  }

  const headers = new Headers(c.req.raw.headers);
  headers.delete("content-encoding");
  headers.set("content-length", bodyBuffer.byteLength.toString());

  c.req.raw = new Request(c.req.raw, {
    body: bodyBuffer,
    headers,
  });

  await next();
});

export default decompressMiddleware;
