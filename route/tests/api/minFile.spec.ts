import { test, describe } from "node:test";
import { expect } from "chai";
import {
  app,
  dummyChart,
  dummyChart10,
  dummyChart11,
  dummyChart12,
  dummyChart13,
  dummyChart6,
  dummyChart7,
  dummyChart8,
  dummyChart9,
  initDb,
} from "./init";
import {
  Chart11Min,
  Chart13Min,
  Chart14Min,
  Chart4,
  Chart5,
  Chart6,
  Chart7,
  Chart8Min,
  Chart9Min,
  currentChartVer,
} from "@falling-nikochan/chart";
import YAML from "yaml";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";

describe("GET /api/minFile/:cid", () => {
  test(
    "should return 429 for too many requests",
    {
      skip:
        process.env.API_ENV === "development" && !!process.env.API_NO_RATELIMIT,
    },
    async () => {
      await initDb();
      const res1 = await app.request("/api/minFile/100000?p=p");
      expect(res1.status).to.equal(200);

      const res2 = await app.request("/api/minFile/100000?p=p");
      expect(res2.status).to.equal(429);
      const body = await res2.json();
      expect(body).to.deep.equal({ message: "tooManyRequest" });
    }
  );

  test("should return YAML if password matches (default type=yml)", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100000?p=p");
    expect(res.status).to.equal(200);
    expect(res.headers.get("content-type")).to.equal("text/yaml; charset=utf-8");
    
    const text = await res.text();
    const chart: Chart14Min = YAML.parse(text);
    expect(chart.ver).to.equal(currentChartVer);
    expect(chart.ytId).to.equal(dummyChart().ytId);
    expect(chart.title).to.equal(dummyChart().title);
  });

  test("should return YAML when type=yml is specified", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100000?p=p&type=yml");
    expect(res.status).to.equal(200);
    expect(res.headers.get("content-type")).to.equal("text/yaml; charset=utf-8");
    
    const text = await res.text();
    const chart: Chart14Min = YAML.parse(text);
    expect(chart.ver).to.equal(currentChartVer);
  });

  test("should return gzip compressed YAML when type=gz is specified", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100000?p=p&type=gz");
    expect(res.status).to.equal(200);
    expect(res.headers.get("content-type")).to.equal("application/gzip");
    expect(res.headers.get("cache-control")).to.equal("no-transform");
    expect(res.headers.get("content-encoding")).to.be.null;
    
    const compressed = await res.arrayBuffer();
    const decompressed = await promisify(gunzip)(Buffer.from(compressed));
    const text = decompressed.toString("utf-8");
    const chart: Chart14Min = YAML.parse(text);
    expect(chart.ver).to.equal(currentChartVer);
    expect(chart.ytId).to.equal(dummyChart().ytId);
  });

  currentChartVer satisfies 14; // edit tests below when chart version is bumped
  
  test("should return Chart13Min if chart version is 13", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100013?p=p");
    expect(res.status).to.equal(200);
    const text = await res.text();
    const chart: Chart13Min = YAML.parse(text);
    expect(chart.ver).to.equal(13);
    expect(chart.ytId).to.equal(dummyChart13().ytId);
  });

  test("should return Chart11Min if chart version is 12", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100012?p=p");
    expect(res.status).to.equal(200);
    const text = await res.text();
    const chart: Chart11Min = YAML.parse(text);
    expect(chart.ver).to.equal(12);
  });

  test("should return Chart11Min if chart version is 11", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100011?p=p");
    expect(res.status).to.equal(200);
    const text = await res.text();
    const chart: Chart11Min = YAML.parse(text);
    expect(chart.ver).to.equal(11);
  });

  test("should return Chart9Min if chart version is 10", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100010?p=p");
    expect(res.status).to.equal(200);
    const text = await res.text();
    const chart: Chart9Min = YAML.parse(text);
    expect(chart.ver).to.equal(10);
  });

  test("should return Chart9Min if chart version is 9", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100009?p=p");
    expect(res.status).to.equal(200);
    const text = await res.text();
    const chart: Chart9Min = YAML.parse(text);
    expect(chart.ver).to.equal(10); // convertToMin9 converts to ver 10
  });

  test("should return Chart8Min if chart version is 8", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100008?p=p");
    expect(res.status).to.equal(200);
    const text = await res.text();
    const chart: Chart8Min = YAML.parse(text);
    expect(chart.ver).to.equal(8);
  });

  test("should return Chart7 (as-is) if chart version is 7", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100007?p=p");
    expect(res.status).to.equal(200);
    const text = await res.text();
    const chart: Chart7 = YAML.parse(text);
    expect(chart.ver).to.equal(7);
  });

  test("should return Chart6 (as-is) if chart version is 6", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100006?p=p");
    expect(res.status).to.equal(200);
    const text = await res.text();
    const chart: Chart6 = YAML.parse(text);
    expect(chart.ver).to.equal(6);
  });

  test("should return Chart5 (as-is) if chart version is 5", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100005?p=p");
    expect(res.status).to.equal(200);
    const text = await res.text();
    const chart: Chart5 = YAML.parse(text);
    expect(chart.ver).to.equal(5);
  });

  test("should return Chart4 (as-is) if chart version is 4", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100004?p=p");
    expect(res.status).to.equal(200);
    const text = await res.text();
    const chart: Chart4 = YAML.parse(text);
    expect(chart.ver).to.equal(4);
  });

  test("should return 400 for invalid cid", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100000a?p=p");
    expect(res.status).to.equal(400);
  });

  test("should return 401 for wrong password", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100000?p=wrong");
    expect(res.status).to.equal(401);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "badPassword" });
  });

  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100002?p=p");
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });

  test("should return 404 for deleted cid", async () => {
    await initDb();
    const res = await app.request("/api/minFile/100001?p=p");
    expect(res.status).to.equal(404);
    const body = await res.json();
    expect(body).to.deep.equal({ message: "chartIdNotFound" });
  });

  test("should work with gzip for all chart versions", async () => {
    await initDb();
    // Test ver14
    const res14 = await app.request("/api/minFile/100000?p=p&type=gz");
    expect(res14.status).to.equal(200);
    const compressed14 = await res14.arrayBuffer();
    const decompressed14 = await promisify(gunzip)(Buffer.from(compressed14));
    const chart14: Chart14Min = YAML.parse(decompressed14.toString("utf-8"));
    expect(chart14.ver).to.equal(14);

    // Test ver8
    const res8 = await app.request("/api/minFile/100008?p=p&type=gz");
    expect(res8.status).to.equal(200);
    const compressed8 = await res8.arrayBuffer();
    const decompressed8 = await promisify(gunzip)(Buffer.from(compressed8));
    const chart8: Chart8Min = YAML.parse(decompressed8.toString("utf-8"));
    expect(chart8.ver).to.equal(8);
  });
});
