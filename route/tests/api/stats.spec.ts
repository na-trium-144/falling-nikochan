import { test, describe } from "node:test";
import { expect } from "chai";
import { app, db, dummyCid, dummyDate, initDb } from "./init";
import {
  ChartEntryCompressed,
  chartToEntry,
  zipEntry,
} from "../../src/api/chart";

describe("GET /api/stats", () => {
  test("should return total chart count (excluding deleted) and total play count", async () => {
    await initDb();
    const res = await app.request("/api/stats");
    expect(res.status).to.equal(200);

    const body = await res.json();
    const expectedChartCount = await db
      .collection<ChartEntryCompressed>("chart")
      .countDocuments({ deleted: false });
    const expectedPlayCount = await db
      .collection("playRecord")
      .countDocuments();

    expect(body).to.have.property("chartCount").that.is.a("number");
    expect(body).to.have.property("playCount").that.is.a("number");
    expect(body.chartCount).to.equal(expectedChartCount);
    expect(body.playCount).to.equal(5);
    expect(body.playCount).to.equal(expectedPlayCount);
  });

  test("should exclude deleted charts from chartCount", async () => {
    await initDb();
    const initialRes = await app.request("/api/stats");
    const initialBody = await initialRes.json();

    // Insert a deleted chart
    await db.collection<ChartEntryCompressed>("chart").insertOne(
      await zipEntry({
        ...(await chartToEntry(
          {
            ver: 17,
            falling: "nikochan",
            offset: 0,
            ytId: "dummyDeleted",
            title: "deleted chart",
            composer: "composer",
            chartCreator: "creator",
            locale: "ja",
            changePasswd: "p",
            published: true,
            copyBuffer: {},
            zoom: 1,
            levelsMeta: [],
            lua: [],
            levelsFreeze: [],
          },
          "999998",
          dummyDate.getTime(),
          null,
          undefined,
          "SecretSalt",
          null
        )),
        deleted: true,
      })
    );

    const resAfterDeleted = await app.request("/api/stats");
    const bodyAfterDeleted = await resAfterDeleted.json();
    expect(bodyAfterDeleted.chartCount).to.equal(initialBody.chartCount);

    // Insert an unpublished, non-deleted chart
    await db.collection<ChartEntryCompressed>("chart").insertOne(
      await zipEntry({
        ...(await chartToEntry(
          {
            ver: 17,
            falling: "nikochan",
            offset: 0,
            ytId: "dummyUnpublished",
            title: "unpublished chart",
            composer: "composer",
            chartCreator: "creator",
            locale: "ja",
            changePasswd: "p",
            published: false,
            copyBuffer: {},
            zoom: 1,
            levelsMeta: [],
            lua: [],
            levelsFreeze: [],
          },
          "999997",
          dummyDate.getTime(),
          null,
          undefined,
          "SecretSalt",
          null
        )),
        deleted: false,
      })
    );

    const resAfterUnpublished = await app.request("/api/stats");
    const bodyAfterUnpublished = await resAfterUnpublished.json();
    expect(bodyAfterUnpublished.chartCount).to.equal(
      initialBody.chartCount + 1
    );
  });

  test("should include legacy playCount from chart collection in total playCount", async () => {
    await initDb();
    const initialRes = await app.request("/api/stats");
    const initialBody = await initialRes.json();

    // Insert a chart with legacy playCount
    await db.collection<ChartEntryCompressed>("chart").insertOne({
      ...(await zipEntry(
        await chartToEntry(
          {
            ver: 17,
            falling: "nikochan",
            offset: 0,
            ytId: "dummyLegacy",
            title: "legacy chart",
            composer: "composer",
            chartCreator: "creator",
            locale: "ja",
            changePasswd: "p",
            published: true,
            copyBuffer: {},
            zoom: 1,
            levelsMeta: [],
            lua: [],
            levelsFreeze: [],
          },
          "999996",
          dummyDate.getTime(),
          null,
          undefined,
          "SecretSalt",
          null
        )
      )),
      playCount: 42,
    });

    const res = await app.request("/api/stats");
    const body = await res.json();
    expect(body.playCount).to.equal(initialBody.playCount + 42);
  });
});
