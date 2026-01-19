import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyChart, dummyDate, initDb } from "./init";
import { ChartBrief, hashLevel } from "@falling-nikochan/chart";

describe("GET /api/brief/:cid", () => {
  test("should return a brief entry", async () => {
    await initDb();
    const res = await app.request("/api/brief/100000");
    expect(res.status).to.equal(200);
    const entry: ChartBrief = await res.json();
    expect(entry).to.deep.equal({
      ytId: dummyChart().ytId,
      title: dummyChart().title,
      composer: dummyChart().composer,
      chartCreator: dummyChart().chartCreator,
      updatedAt: dummyDate.getTime(),
      published: true,
      locale: dummyChart().locale,
      levels: [
        {
          name: "e",
          hash: await hashLevel(dummyChart().levels[0]),
          type: "Single",
          difficulty: 1,
          noteCount: 1,
          bpmMin: 120,
          bpmMax: 180,
          length: 1.23,
          unlisted: false,
        },
      ],
    });
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/brief/100002");
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
  test("should return 404 for deleted cid", async () => {
    await initDb();
    const res = await app.request("/api/brief/100001");
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/brief/invalid");
    expect(res.status).to.equal(400);
  });
});
