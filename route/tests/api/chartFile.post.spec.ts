import { test, describe } from "node:test";
import { expect } from "chai";
import {
  app,
  dummyChart,
  dummyChart11,
  dummyChart13,
  dummyCid,
  dummyDate,
  initDb,
} from "./init";
import {
  chartMaxEvent,
  currentChartVer,
  fileMaxSize,
  hash,
  hashLevel,
} from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "@falling-nikochan/route/src/api/chart";

describe("POST /api/chartFile/:cid", () => {
  test(
    "should return 429 for too many requests",
    {
      skip:
        process.env.API_ENV === "development" && !!process.env.API_NO_RATELIMIT,
    },
    async () => {
      await initDb();
      const res1 = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode({ ...dummyChart(), title: "updated" }),
      });
      expect(res1.status).to.equal(204);

      const res2 = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode({ ...dummyChart(), title: "updated" }),
      });
      expect(res2.status).to.equal(429);
      const body = await res2.json();
      expect(body).to.deep.equal({ message: "tooManyRequest" });
    }
  );

  test("should update chart if raw password matches", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.encode({ ...dummyChart(), title: "updated" }),
    });
    expect(res.status).to.equal(204);

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: dummyCid });
      expect(e).not.to.be.null;
      expect(e!.title).to.equal("updated");
    } finally {
      await client.close();
    }
  });
  test("should update chart if password hash matches", async () => {
    await initDb();
    let pServerHash: string;
    {
      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        pServerHash = (await (await client.connect())
          .db("nikochan")
          .collection<ChartEntryCompressed>("chart")
          .findOne({ cid: "100000" }))!.pServerHash!;
      } finally {
        client.close();
      }
    }
    const res = await app.request(
      "/api/chartFile/100000?ph=" + (await hash(pServerHash + "def")),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.msgpack",
          Cookie: "pUserSalt=def",
        },
        body: msgpack.encode({ ...dummyChart(), title: "updated" }),
      }
    );
    expect(res.status).to.equal(204);

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: dummyCid });
      expect(e).not.to.be.null;
      expect(e!.title).to.equal("updated");
    } finally {
      await client.close();
    }
  });
  test("should save ip address", async () => {
    await initDb();
    let res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
        "x-forwarded-for": "123",
      },
      body: msgpack.encode(dummyChart()),
    });
    expect(res.status).to.equal(204);

    let client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: dummyCid });
      expect(e).not.to.be.null;
      expect(e!.ip).to.deep.equal(["123"]);
    } finally {
      await client.close();
    }

    res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
        "x-forwarded-for": "456",
      },
      body: msgpack.encode(dummyChart()),
    });
    expect(res.status).to.equal(204);

    client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: dummyCid });
      expect(e).not.to.be.null;
      expect(e!.ip).to.deep.equal(["123", "456"]);
    } finally {
      await client.close();
    }
  });
  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000a?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.encode({ ...dummyChart(), title: "updated" }),
    });
    expect(res.status).to.equal(400);
  });
  test("should return 401 for wrong password", async () => {
    await initDb();
    const res = await app.request(
      "/api/chartFile/100000?p=wrong&ph=" + (await hash("wrong")),
      {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode({ ...dummyChart(), title: "updated" }),
      }
    );
    expect(res.status).to.equal(401);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "badPassword" });
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100002?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.encode({ ...dummyChart(), title: "updated" }),
    });
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
  test("should return 404 for deleted cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100001?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.encode({ ...dummyChart(), title: "updated" }),
    });
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
  test("should return 413 for large file", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: new ArrayBuffer(fileMaxSize + 1),
    });
    expect(res.status).to.equal(413);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "tooLargeFile" });
  });
  test("should return 413 for chart containing too many events", async () => {
    await initDb();
    const chart = dummyChart();
    chart.levelsFreeze[0].rest = new Array(chartMaxEvent + 1).fill(
      chart.levelsFreeze[0].rest[0]
    );
    const res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.encode(chart),
    });
    expect(res.status).to.equal(413);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "tooManyEvent" });
  });
  test("should return 409 for chart version older than 13", async () => {
    currentChartVer satisfies 14; // edit this test when chart version is bumped
    await initDb();
    const res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.encode({ ...dummyChart11() }),
    });
    expect(res.status).to.equal(409);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "oldChartVersion" });
  });
  test("should update chart for chart version 13", async () => {
    currentChartVer satisfies 14; // edit this test when chart version is bumped
    await initDb();
    const res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.encode({ ...dummyChart13(), title: "updated" }),
    });
    expect(res.status).to.equal(204);

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: dummyCid });
      expect(e).not.to.be.null;
      expect(e!.title).to.equal("updated");
    } finally {
      await client.close();
    }
  });
  test("should return 415 for invalid chart", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      body: "invalid",
    });
    expect(res.status).to.equal(415);
  });
  describe("password of chart", () => {
    test("should not be changed if changePasswd is null", async () => {
      await initDb();
      const res = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode(dummyChart()),
      });
      expect(res.status).to.equal(204);

      expect(
        (
          await app.request("/api/chartFile/100000?p=p", {
            headers: {
              "x-forwarded-for": "123", // rateLimit回避
            },
          })
        ).status
      ).to.equal(200);
    });
    test("should be changed if changePasswd is not null", async () => {
      await initDb();
      const res = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode({
          ...dummyChart(),
          changePasswd: "newPasswd",
        }),
      });
      expect(res.status).to.equal(204);

      expect(
        (
          await app.request("/api/chartFile/100000?p=p", {
            headers: {
              "x-forwarded-for": "123",
            },
          })
        ).status
      ).to.equal(401);
      expect(
        (
          await app.request("/api/chartFile/100000?p=newPasswd", {
            headers: {
              "x-forwarded-for": "456",
            },
          })
        ).status
      ).to.equal(200);
    });
  });
  describe("ChartEntry.updatedAt", () => {
    test("should not be updated with uploading same chart", async () => {
      await initDb();
      const res = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode(dummyChart()),
      });
      expect(res.status).to.equal(204);

      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        await client.connect();
        const db = client.db("nikochan");
        const e = await db
          .collection<ChartEntryCompressed>("chart")
          .findOne({ cid: dummyCid });
        expect(e).not.to.be.null;
        expect(e!.updatedAt).to.equal(dummyDate.getTime());
      } finally {
        await client.close();
      }
    });
    test("should not be updated with metadata change", async () => {
      await initDb();
      const res = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode({ ...dummyChart(), title: "updated" }),
      });
      expect(res.status).to.equal(204);

      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        await client.connect();
        const db = client.db("nikochan");
        const e = await db
          .collection<ChartEntryCompressed>("chart")
          .findOne({ cid: dummyCid });
        expect(e).not.to.be.null;
        expect(e!.updatedAt).to.equal(dummyDate.getTime());
      } finally {
        await client.close();
      }
    });
    test("should be updated with level change", async () => {
      await initDb();
      const chart = dummyChart();
      chart.levelsFreeze[0].notes = new Array(10).fill(
        chart.levelsFreeze[0].notes[0]
      );
      const dateBefore = new Date();
      const res = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode(chart),
      });
      const dateAfter = new Date();
      expect(res.status).to.equal(204);

      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        await client.connect();
        const db = client.db("nikochan");
        const e = await db
          .collection<ChartEntryCompressed>("chart")
          .findOne({ cid: dummyCid });
        expect(e).not.to.be.null;
        expect(e!.updatedAt).to.be.at.least(dateBefore.getTime());
        expect(e!.updatedAt).to.be.at.most(dateAfter.getTime());
        expect(e!.levelBrief[0].hash).to.not.equal(
          await hashLevel(dummyChart().levelsFreeze[0])
        );
      } finally {
        await client.close();
      }
    });
    test("should be updated with publish", async () => {
      await initDb();
      const dateBefore = new Date();
      await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.encode({ ...dummyChart(), published: false }),
      });
      const res = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.msgpack",
          "x-forwarded-for": "123",
        },
        body: msgpack.encode({ ...dummyChart(), published: true }),
      });
      const dateAfter = new Date();
      expect(res.status).to.equal(204);

      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        await client.connect();
        const db = client.db("nikochan");
        const e = await db
          .collection<ChartEntryCompressed>("chart")
          .findOne({ cid: dummyCid });
        expect(e).not.to.be.null;
        expect(e!.updatedAt).to.be.at.least(dateBefore.getTime());
        expect(e!.updatedAt).to.be.at.most(dateAfter.getTime());
      } finally {
        await client.close();
      }
    });
    test("should not be updated when re-calculated hash matches regardless of hash on db", async () => {
      await initDb();
      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        await client.connect();
        const db = client.db("nikochan");

        await db.collection<ChartEntryCompressed>("chart").updateOne(
          { cid: "100007" },
          {
            $set: {
              "levelBrief.0.hash": "aaaaa",
            },
          }
        );
        const res = await app.request("/api/chartFile/100007?p=p", {
          method: "POST",
          headers: { "Content-Type": "application/vnd.msgpack" },
          body: msgpack.encode(dummyChart()),
        });
        expect(res.status).to.equal(204);

        const e = await db
          .collection<ChartEntryCompressed>("chart")
          .findOne({ cid: String(Number(dummyCid) + 7) });
        expect(e).not.to.be.null;
        expect(e!.updatedAt).to.equal(dummyDate.getTime());
        expect(e!.levelBrief[0].hash).to.equal("aaaaa");
      } finally {
        await client.close();
      }
    });
  });
});
