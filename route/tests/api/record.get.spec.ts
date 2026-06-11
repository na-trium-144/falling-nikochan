import { test, describe } from "node:test";
import { expect } from "chai";
import { app, initDb } from "./init";
import { RecordGetSummary } from "@falling-nikochan/chart";

describe("GET /api/record/:cid", () => {
  test("should return summary", async () => {
    await initDb();
    const res = await app.request("/api/record/100000");
    expect(res.status).to.equal(200);
    const summary: RecordGetSummary[] = await res.json();
    expect(summary).to.deep.equal([
      {
        lvHash: "dummy",
        count: Math.ceil(0.7 + 0.1 + 0.5 + 1),
        countAuto: Math.ceil(1),
        countFC: Math.ceil(0.7 + 0.1),
        countFB: 0,
        histogram: [
          0,
          0,
          0,
          Math.ceil(1),
          0,
          Math.ceil(0.5),
          0,
          0,
          0,
          0,
          Math.ceil(0.7 + 0.1),
          0,
          0,
        ],
      },
    ]);
  });
  test("should return 304 for matching If-None-Match", async () => {
    await initDb();
    const res1 = await app.request("/api/record/100000");
    expect(res1.status).to.equal(200);
    const etag = res1.headers.get("etag");
    expect(etag).to.be.a("string");

    const res2 = await app.request("/api/record/100000", {
      headers: { "If-None-Match": etag! },
    });
    expect(res2.status).to.equal(304);
  });
});
