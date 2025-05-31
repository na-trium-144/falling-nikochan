import { expect, test, describe } from "bun:test";
import { app, initDb } from "./init";
import { RecordGetSummary } from "@falling-nikochan/chart";

describe("GET /api/record/:cid", () => {
  test("should return summary", async () => {
    await initDb();
    const res = await app.request("/api/record/100000");
    expect(res.status).toBe(200);
    const summary: RecordGetSummary[] = await res.json();
    expect(summary).toStrictEqual([
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
});
