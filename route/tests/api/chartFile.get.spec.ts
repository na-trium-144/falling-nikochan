import { test, describe } from "node:test";
import { expect } from "chai";
import {
  app,
  db,
  dummyChart,
  dummyChart10,
  dummyChart11,
  dummyChart12,
  dummyChart13,
  dummyChart14,
  dummyChart15,
  dummyChart16,
  dummyChart17,
  dummyChart6,
  dummyChart7,
  dummyChart8,
  dummyChart9,
  dummyCid,
  initDb,
} from "./init";
import {
  Chart11Edit,
  Chart13Edit,
  Chart14Edit,
  Chart15,
  Chart4,
  Chart5,
  Chart6,
  Chart7,
  Chart8Edit,
  Chart9Edit,
  currentChartVer,
  hash,
} from "@falling-nikochan/chart";
import * as msgpack from "@msgpack/msgpack";
import {
  calcETag,
  ChartEntryCompressed,
  getChartEntryCompressed,
} from "@falling-nikochan/route/src/api/chart";

const encodeBase64Utf8 = (value: string) =>
  btoa(
    Array.from(new TextEncoder().encode(value), (byte) =>
      String.fromCodePoint(byte)
    ).join("")
  );
const basicAuth = (passwd: string) =>
  `Nikochan-Basic ${encodeBase64Utf8(passwd)}`;
const hashAuth = (passwdHash: string) => `Nikochan-Hash ${passwdHash}`;
const getServerHash = async () => {
  return (await db
    .collection<ChartEntryCompressed>("chart")
    .findOne({ cid: "100000" }))!.pServerHash!;
};

describe("GET /api/chartFile/:cid", () => {
  test(
    "should return 429 for too many requests",
    {
      skip:
        process.env.API_ENV === "development" && !!process.env.API_NO_RATELIMIT,
    },
    async () => {
      await initDb();
      const res1 = await app.request("/api/chartFile/100000", {
        headers: { Authorization: basicAuth("p") },
      });
      expect(res1.status).to.equal(200);

      const res2 = await app.request("/api/chartFile/100000", {
        headers: { Authorization: basicAuth("p") },
      });
      expect(res2.status).to.equal(429);
      const body = await res2.json();
      expect(body).to.deep.equal({ message: "tooManyRequest" });
    }
  );

  test("should return ChartEdit if password hash matches", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000", {
      headers: { Authorization: basicAuth("p") },
    });
    expect(res.status).to.equal(200);
    const chart = msgpack.decode(await res.arrayBuffer());
    expect(chart).to.deep.equal({ ...dummyChart(), published: true });
  });
  test("should return ChartEdit if password hash with pUserSalt matches", async () => {
    await initDb();
    const pServerHash = await getServerHash();

    const res = await app.request("/api/chartFile/100000", {
      headers: {
        Authorization: hashAuth(await hash(pServerHash + "def")),
        Cookie: "pUserSalt=def",
      },
    });
    expect(res.status).to.equal(200);
    const chart = msgpack.decode(await res.arrayBuffer()) as Chart15;
    expect(chart).to.deep.equal({ ...dummyChart(), published: true });
  });
  test("should return ChartEdit when p query is used for backward compatibility", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000?p=p");
    expect(res.status).to.equal(200);
  });
  test("should return ChartEdit when ph query is used for backward compatibility", async () => {
    await initDb();
    const pServerHash = await getServerHash();
    const res = await app.request(
      "/api/chartFile/100000?ph=" + (await hash(pServerHash + "def")),
      {
        headers: { Cookie: "pUserSalt=def" },
      }
    );
    expect(res.status).to.equal(200);
  });
  test("should return ETag calculated by calcETag()", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000", {
      headers: { Authorization: basicAuth("p") },
    });
    expect(res.status).to.equal(200);
    const entry = await getChartEntryCompressed(db, "100000", null);
    expect(res.headers.get("etag")).to.equal(await calcETag(entry));
  });
  test("should return 304 for matching If-None-Match", async () => {
    await initDb();
    const res1 = await app.request("/api/chartFile/100000", {
      headers: { Authorization: basicAuth("p") },
    });
    expect(res1.status).to.equal(200);
    const etag = res1.headers.get("etag");
    expect(etag).to.be.a("string");

    const res2 = await app.request("/api/chartFile/100000", {
      headers: {
        Authorization: basicAuth("p"),
        "If-None-Match": etag!,
        "x-forwarded-for": "123",
      },
    });
    expect(res2.status).to.equal(304);
  });
  test("should return 200 for matching If-Match", async () => {
    await initDb();
    const res1 = await app.request("/api/chartFile/100000", {
      headers: { Authorization: basicAuth("p") },
    });
    expect(res1.status).to.equal(200);
    const etag = res1.headers.get("etag");
    expect(etag).to.be.a("string");

    const res2 = await app.request("/api/chartFile/100000", {
      headers: {
        Authorization: basicAuth("p"),
        "If-Match": etag!,
        "x-forwarded-for": "123",
      },
    });
    expect(res2.status).to.equal(200);
  });
  test("should return 412 for mismatching If-Match", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000", {
      headers: {
        Authorization: basicAuth("p"),
        "If-Match": '"invalid-etag"',
      },
    });
    expect(res.status).to.equal(412);
    expect(await res.json()).to.deep.equal({ message: "etagMismatch" });
  });
  currentChartVer satisfies 18; // edit tests below when chart version is bumped
  for (const chart of [
    dummyChart17(),
    dummyChart16(),
    dummyChart15(),
    dummyChart14(),
    dummyChart13(),
    dummyChart12(),
    dummyChart11(),
    dummyChart10(),
    dummyChart9(),
    dummyChart8(),
    dummyChart7(),
    dummyChart6(),
  ] as const) {
    test(`should return Chart${chart.ver} if chart version is ${chart.ver}`, async () => {
      await initDb();
      const res = await app.request(
        "/api/chartFile/" + String(Number(dummyCid) + chart.ver),
        {
          headers: { Authorization: basicAuth("p") },
        }
      );
      expect(res.status).to.equal(200);
      expect(msgpack.decode(await res.arrayBuffer())).to.deep.equal(chart);
    });
  }
  test("should return Chart5 if chart version is 5", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100005", {
      headers: { Authorization: basicAuth("p") },
    });
    expect(res.status).to.equal(200);
    const chart = msgpack.decode(await res.arrayBuffer()) as Chart5;
    // expect(chart).to.deep.equal(dummyChart5());
    expect(chart.ver).to.equal(5);
  });
  test("should return Chart4 if chart version is 4", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100004", {
      headers: { Authorization: basicAuth("p") },
    });
    expect(res.status).to.equal(200);
    const chart = msgpack.decode(await res.arrayBuffer()) as Chart4;
    // expect(chart).to.deep.equal(dummyChart4());
    expect(chart.ver).to.equal(4);
  });

  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000a", {
      headers: { Authorization: basicAuth("p") },
    });
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.message).to.equal("badRequest");
    expect(body.flattened.nested.cid[0]).to.be.a("string");
  });
  test("should return 401 for wrong password", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100000", {
      headers: { Authorization: basicAuth("wrong") },
    });
    expect(res.status).to.equal(401);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "badPassword" });
  });
  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100002", {
      headers: { Authorization: basicAuth("p") },
    });
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
  test("should return 404 for deleted cid", async () => {
    await initDb();
    const res = await app.request("/api/chartFile/100001", {
      headers: { Authorization: basicAuth("p") },
    });
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });
});
