import { describe, test } from "node:test";
import { expect } from "chai";
import ogApp from "../src/og/app";
import { ImageResponse } from "@vercel/og";
import { fetchBrief, initDb, testFetchStatic } from "./api/init";
import { onError } from "../src/error";
import { Bindings, resultSecretKey } from "../src/env";
import {
  resultSerialized,
  testResultParams,
} from "./api/resultSigning.verify.get.spec";
import { serializeResultParamsLegacy } from "@falling-nikochan/chart";
import { structuredLogger } from "@hono/structured-logger";
import { Hono } from "hono";

const app = new Hono<{ Bindings: Bindings }>({ strict: false });
app
  .use(
    structuredLogger({
      createLogger: () => console,
      onRequest: () => undefined,
      onResponse: () => undefined,
    })
  )
  .route(
    "/og/",
    ogApp({
      ImageResponse,
      fetchBrief,
      fetchStatic: testFetchStatic,
    })
  )
  .onError(
    onError({
      fetchStatic: testFetchStatic,
      isTest: true,
      captureException: null,
      setTransactionName: null,
    })
  );

async function assertOGImage(res: Response) {
  // 1. ステータスコードと Content-Type の確認
  expect(res.status).to.equal(200);
  expect(res.headers.get("content-type")).to.equal("image/png");

  // 2. レスポンスを Buffer に変換
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 3. PNG シグネチャ（先頭8バイト: 89 50 4E 47 0D 0A 1A 0A）の検証
  const pngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  expect(buffer.subarray(0, 8).equals(pngSignature)).to.be.true;

  // 4. 幅と高さの検証（IHDRチャンクの 16バイト目から幅4バイト、20バイト目から高さ4バイト）
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);

  expect(width).to.equal(1200);
  expect(height).to.equal(630);
}

describe("ogApp", () => {
  describe("share", () => {
    test("should redirect to the same url with data in query parameter", async () => {
      await initDb();
      const res = await app.request("/og/share/100000");
      expect(res.status).to.equal(307);
      const location = new URL(res.headers.get("Location")!);
      expect(location.pathname).to.equal("/og/share/100000");
      expect(location.searchParams.get("lang")).to.equal("en"); // default
      expect(location.searchParams.has("brief")).to.be.true;
    });
    test("should preserve lang parameter on redirect", async () => {
      await initDb();
      const res = await app.request("/og/share/100000?lang=ja");
      expect(res.status).to.equal(307);
      const location = new URL(res.headers.get("Location")!);
      expect(location.pathname).to.equal("/og/share/100000");
      expect(location.searchParams.get("lang")).to.equal("ja"); // default
      expect(location.searchParams.has("brief")).to.be.true;
    });
    test("should return image on /share/:cid after one redirect", async () => {
      await initDb();
      const res = await app.request("/og/share/100000");
      const res2 = await app.request(res.headers.get("Location")!);
      await assertOGImage(res2);
    });
    test("should return 404 for nonexistent cid", async () => {
      await initDb();
      const res = await app.request("/og/share/100002");
      expect(res.status).to.equal(404);
    });
    test("should return 404 for deleted cid", async () => {
      await initDb();
      const res = await app.request("/og/share/100001");
      expect(res.status).to.equal(404);
    });
    // test("should return 400 for invalid cid", async () => {
    //   await initDb();
    //   const res = await app.request("/og/share/invalid");
    //   expect(res.status).to.equal(400);
    // });

    test("should not fail on unsupported lang", async () => {
      await initDb();
      const res = await app.request("/og/share/100000?lang=foo");
      const res2 = await app.request(res.headers.get("Location")!);
      await assertOGImage(res2);
    });
  });

  describe("result", () => {
    test("should redirect to the same url with data in query parameter", async () => {
      await initDb();
      const res = await app.request("/og/result/100000");
      expect(res.status).to.equal(307);
      const location = new URL(res.headers.get("Location")!);
      expect(location.pathname).to.equal("/og/result/100000");
      expect(location.searchParams.get("lang")).to.equal("en"); // default
      expect(location.searchParams.has("brief")).to.be.true;
    });
    test("should preserve lang parameter on redirect", async () => {
      await initDb();
      const res = await app.request("/og/result/100000?lang=ja");
      expect(res.status).to.equal(307);
      const location = new URL(res.headers.get("Location")!);
      expect(location.pathname).to.equal("/og/result/100000");
      expect(location.searchParams.get("lang")).to.equal("ja"); // default
      expect(location.searchParams.has("brief")).to.be.true;
    });
    test("should return image on /result/:cid with valid result param after one redirect", async () => {
      await initDb();
      const key = await resultSecretKey(process.env as any);
      const signature = await crypto.subtle.sign(
        { name: "HMAC", hash: { name: "SHA-256" } },
        key,
        Buffer.from(resultSerialized, "base64url")
      );
      const signatureBase64Url = Buffer.from(signature.slice(0, 12)).toString(
        "base64url"
      );
      const param = `${resultSerialized}.${signatureBase64Url}`;
      const res = await app.request(
        `/og/result/100000?result=${encodeURIComponent(param)}`
      );
      const res2 = await app.request(res.headers.get("Location")!);
      await assertOGImage(res2);
    });

    test("should return 422 for tampered signature", async () => {
      await initDb();

      const param = `${resultSerialized}.invalidSignature`;

      const res = await app.request(
        `/og/result/100000?result=${encodeURIComponent(param)}`
      );
      const res2 = await app.request(res.headers.get("Location")!);
      expect(res2.status).to.equal(422);
    });

    test("should return image for legacy result version (ver < 4)", async () => {
      await initDb();

      const legacySerialized = serializeResultParamsLegacy(testResultParams);
      const res = await app.request(
        `/og/result/100000?result=${encodeURIComponent(legacySerialized)}`
      );
      const res2 = await app.request(res.headers.get("Location")!);
      await assertOGImage(res2);
    });

    test("should return 400 for invalid result parameter", async () => {
      await initDb();

      const res = await app.request(`/og/result/100000?result=invalid-param`);
      const res2 = await app.request(res.headers.get("Location")!);
      expect(res2.status).to.equal(400);
    });

    test("should return 400 for missing result parameter", async () => {
      await initDb();

      const res = await app.request(`/og/result/100000`);
      const res2 = await app.request(res.headers.get("Location")!);
      expect(res2.status).to.equal(400);
    });

    test("should return 404 for nonexistent cid", async () => {
      await initDb();
      const res = await app.request("/og/result/100002");
      expect(res.status).to.equal(404);
    });
    test("should return 404 for deleted cid", async () => {
      await initDb();
      const res = await app.request("/og/result/100001");
      expect(res.status).to.equal(404);
    });
    // test("should return 400 for invalid cid", async () => {
    //   await initDb();
    //   const res = await app.request("/og/result/invalid");
    //   expect(res.status).to.equal(400);
    // });

    test("should not fail on unsupported lang", async () => {
      await initDb();
      const key = await resultSecretKey(process.env as any);
      const signature = await crypto.subtle.sign(
        { name: "HMAC", hash: { name: "SHA-256" } },
        key,
        Buffer.from(resultSerialized, "base64url")
      );
      const signatureBase64Url = Buffer.from(signature.slice(0, 12)).toString(
        "base64url"
      );
      const param = `${resultSerialized}.${signatureBase64Url}`;
      const res = await app.request(
        `/og/result/100000?lang=foo&result=${encodeURIComponent(param)}`
      );
      const res2 = await app.request(res.headers.get("Location")!);
      await assertOGImage(res2);
    });
  });
});
