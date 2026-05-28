import { describe, test } from "node:test";
import { expect } from "chai";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import decompressMiddleware from "../../src/api/decompress";

const gzipAsync = promisify(gzip);

describe("decompress middleware", () => {
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
      body: await gzipAsync(Buffer.from("hello")),
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
    expect(res.headers.get("Accept-Encoding")).to.equal("identity, gzip");
    expect(await res.json()).to.deep.equal({
      message: "unsupportedContentEncoding",
    });
  });
});
