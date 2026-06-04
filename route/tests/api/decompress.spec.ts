import { describe, test } from "node:test";
import { expect } from "chai";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import decompressMiddleware from "../../src/api/decompress";

const gzipAsync = async (payload: string): Promise<ArrayBuffer> => {
  const stream = new Blob([payload])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  return await new Response(stream).arrayBuffer();
};

describe("decompress middleware", () => {
  // Keep middleware order aligned with route/src/api/app.ts.
  const app = new Hono()
    .use("/*", bodyLimit({ maxSize: 1024 * 1024 }))
    .use("/*", decompressMiddleware)
    .post("/echo", async (c) => {
      return c.text(new TextDecoder().decode(await c.req.arrayBuffer()));
    });

  test("should decode gzip request body", async () => {
    const res = await app.request("/echo", {
      method: "POST",
      headers: {
        "Content-Encoding": "gzip",
      },
      body: await gzipAsync("hello"),
    });

    expect(res.status).to.equal(200);
    expect(await res.text()).to.equal("hello");
  });

  test("should return 415 for unsupported content-encoding", async () => {
    const res = await app.request("/echo", {
      method: "POST",
      headers: {
        "Content-Encoding": "br",
      },
      body: "hello",
    });

    expect(res.status).to.equal(415);
    expect(res.headers.get("Accept-Encoding")).to.equal("gzip");
    expect(await res.json()).to.deep.equal({
      message: "unsupportedContentEncoding",
    });
  });

  test("should return 415 for invalid gzip body", async () => {
    const res = await app.request("/echo", {
      method: "POST",
      headers: {
        "Content-Encoding": "gzip",
      },
      body: "not-gzip",
    });

    expect(res.status).to.equal(415);
    expect(res.headers.get("Accept-Encoding")).to.equal("gzip");
    expect(await res.json()).to.deep.equal({
      message: "invalidContentEncoding",
    });
  });
});
