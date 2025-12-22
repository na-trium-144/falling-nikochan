import { expect, test, describe } from "vitest";
import {
  app,
  dummyChart,
  dummyChart11,
  dummyCid,
  dummyDate,
  initDb,
} from "./init";
import { chartMaxEvent, fileMaxSize, hash } from "@falling-nikochan/chart";
import msgpack from "@ygoe/msgpack";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "@falling-nikochan/route/src/api/chart";

describe("POST /api/chartFile/:cid", () => {
  test.skipIf(
    process.env.API_ENV === "development" && !!process.env.API_NO_RATELIMIT
  )("should return 429 for too many requests", async () => {
    await initDb();
    const res1 = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
    });
    expect(res1.status).toBe(204);

    const res2 = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
    });
    expect(res2.status).toBe(429);
    const body = await res2.json();
    expect(body).toStrictEqual({ message: "tooManyRequest" });
  });

  test("should update chart if raw password matches", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
    });
    expect(res.status).toBe(204);

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: dummyCid });
      expect(e).not.toBeNull();
      expect(e!.title).toBe("updated");
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
        body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
      }
    );
    expect(res.status).toBe(204);

    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: dummyCid });
      expect(e).not.toBeNull();
      expect(e!.title).toBe("updated");
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
      body: msgpack.serialize(dummyChart()),
    });
    expect(res.status).toBe(204);

    let client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: dummyCid });
      expect(e).not.toBeNull();
      expect(e!.ip).toStrictEqual(["123"]);
    } finally {
      await client.close();
    }

    res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
        "x-forwarded-for": "456",
      },
      body: msgpack.serialize(dummyChart()),
    });
    expect(res.status).toBe(204);

    client = new MongoClient(process.env.MONGODB_URI!);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const e = await db
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: dummyCid });
      expect(e).not.toBeNull();
      expect(e!.ip).toStrictEqual(["123", "456"]);
    } finally {
      await client.close();
    }
  });
  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000a?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
    });
    expect(res.status).toBe(400);
  });
  test("should return 401 for wrong password", async () => {
    await initDb();
    const res = await app.request(
      "/api/chartFile/100000?p=wrong&ph=" + (await hash("wrong")),
      {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
      }
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "badPassword" });
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100002?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "chartIdNotFound" });
  });
  test("should return 404 for deleted cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100001?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "chartIdNotFound" });
  });
  test("should return 413 for large file", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: new ArrayBuffer(fileMaxSize + 1),
    });
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "tooLargeFile" });
  });
  test("should return 413 for chart containing too many events", async () => {
    await initDb();
    const chart = dummyChart();
    chart.levels[0].rest = new Array(chartMaxEvent + 1).fill(
      chart.levels[0].rest[0]
    );
    const res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize(chart),
    });
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "tooManyEvent" });
  });
  test("should return 409 for old chart version", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      headers: { "Content-Type": "application/vnd.msgpack" },
      body: msgpack.serialize({ ...dummyChart11() }),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toStrictEqual({ message: "oldChartVersion" });
  });
  test("should return 415 for invalid chart", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?p=p", {
      method: "POST",
      body: "invalid",
    });
    expect(res.status).toBe(415);
  });
  describe("password of chart", () => {
    test("should not be changed if changePasswd is null", async () => {
      await initDb();
      const res = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.serialize(dummyChart()),
      });
      expect(res.status).toBe(204);

      expect(
        (
          await app.request("/api/chartFile/100000?p=p", {
            headers: {
              "x-forwarded-for": "123", // rateLimit回避
            },
          })
        ).status
      ).toStrictEqual(200);
    });
    test("should be changed if changePasswd is not null", async () => {
      await initDb();
      const res = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.serialize({
          ...dummyChart(),
          changePasswd: "newPasswd",
        }),
      });
      expect(res.status).toBe(204);

      expect(
        (
          await app.request("/api/chartFile/100000?p=p", {
            headers: {
              "x-forwarded-for": "123",
            },
          })
        ).status
      ).toStrictEqual(401);
      expect(
        (
          await app.request("/api/chartFile/100000?p=newPasswd", {
            headers: {
              "x-forwarded-for": "456",
            },
          })
        ).status
      ).toStrictEqual(200);
    });
  });
  describe("ChartEntry.updatedAt", () => {
    test("should not be updated with uploading same chart", async () => {
      await initDb();
      const res = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.serialize(dummyChart()),
      });
      expect(res.status).toBe(204);

      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        await client.connect();
        const db = client.db("nikochan");
        const e = await db
          .collection<ChartEntryCompressed>("chart")
          .findOne({ cid: dummyCid });
        expect(e).not.toBeNull();
        expect(e!.updatedAt).toBe(dummyDate.getTime());
      } finally {
        await client.close();
      }
    });
    test("should not be updated with metadata change", async () => {
      await initDb();
      const res = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.serialize({ ...dummyChart(), title: "updated" }),
      });
      expect(res.status).toBe(204);

      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        await client.connect();
        const db = client.db("nikochan");
        const e = await db
          .collection<ChartEntryCompressed>("chart")
          .findOne({ cid: dummyCid });
        expect(e).not.toBeNull();
        expect(e!.updatedAt).toBe(dummyDate.getTime());
      } finally {
        await client.close();
      }
    });
    test("should be updated with level change", async () => {
      await initDb();
      const chart = dummyChart();
      chart.levels[0].notes = new Array(10).fill(chart.levels[0].notes[0]);
      const dateBefore = new Date();
      const res = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: { "Content-Type": "application/vnd.msgpack" },
        body: msgpack.serialize(chart),
      });
      const dateAfter = new Date();
      expect(res.status).toBe(204);

      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        await client.connect();
        const db = client.db("nikochan");
        const e = await db
          .collection<ChartEntryCompressed>("chart")
          .findOne({ cid: dummyCid });
        expect(e).not.toBeNull();
        expect(e!.updatedAt).toBeGreaterThanOrEqual(dateBefore.getTime());
        expect(e!.updatedAt).toBeLessThanOrEqual(dateAfter.getTime());
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
        body: msgpack.serialize({ ...dummyChart(), published: false }),
      });
      const res = await app.request("/api/chartFile/100000?p=p", {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.msgpack",
          "x-forwarded-for": "123",
        },
        body: msgpack.serialize({ ...dummyChart(), published: true }),
      });
      const dateAfter = new Date();
      expect(res.status).toBe(204);

      const client = new MongoClient(process.env.MONGODB_URI!);
      try {
        await client.connect();
        const db = client.db("nikochan");
        const e = await db
          .collection<ChartEntryCompressed>("chart")
          .findOne({ cid: dummyCid });
        expect(e).not.toBeNull();
        expect(e!.updatedAt).toBeGreaterThanOrEqual(dateBefore.getTime());
        expect(e!.updatedAt).toBeLessThanOrEqual(dateAfter.getTime());
      } finally {
        await client.close();
      }
    });
  });
});
