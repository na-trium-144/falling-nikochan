import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyChart } from "./init";
import {
  ChartSeqData,
  currentChartVer,
  loadChart,
} from "@falling-nikochan/chart";
import msgpack from "@msgpack/msgpack";

describe("POST /api/seqPreview", () => {
  test("should return ChartSeqData from valid Chart17 data", async () => {
    currentChartVer satisfies 17;
    const chartData = dummyChart();
    const encodedBody = msgpack.encode(chartData);

    const res = await app.request("/api/seqPreview?lvIndex=0", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
      },
      body: encodedBody,
    });

    expect(res.status).to.equal(200);
    expect(res.headers.get("Content-Type")).to.equal("application/vnd.msgpack");
    expect(res.headers.get("Content-Disposition")).to.include(
      "preview.fnseq.mpk"
    );

    const seqData = msgpack.decode(await res.arrayBuffer()) as ChartSeqData;
    expect(seqData.notes).to.deep.equal(loadChart(dummyChart(), 0).notes);
  });

  test("should return 400 for missing lvIndex query param", async () => {
    const chartData = dummyChart();
    const encodedBody = msgpack.encode(chartData);

    const res = await app.request("/api/seqPreview", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
      },
      body: encodedBody,
    });

    expect(res.status).to.equal(400);
  });

  test("should return 415 for invalid msgpack", async () => {
    const invalidBody = new Uint8Array([0xff, 0xfe, 0xfd]);

    const res = await app.request("/api/seqPreview?lvIndex=0", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
      },
      body: invalidBody,
    });

    expect(res.status).to.equal(415);
    const body = await res.json();
    expect(body.message).to.equal("invalidChart");
  });

  test("should return 415 for invalid Chart data (missing required fields)", async () => {
    const invalidData = {
      ver: currentChartVer,
      // missing required fields
    };
    const encodedBody = msgpack.encode(invalidData);

    const res = await app.request("/api/seqPreview?lvIndex=0", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
      },
      body: encodedBody,
    });

    expect(res.status).to.equal(415);
    const body = await res.json();
    expect(body.message).to.include("invalidChart");
  });

  test("should return 409 for invalid ver field", async () => {
    currentChartVer satisfies 17;
    const chartData = dummyChart();
    const invalidData = {
      ...chartData,
      ver: 14, // wrong version
    };
    const encodedBody = msgpack.encode(invalidData);

    const res = await app.request("/api/seqPreview?lvIndex=0", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
      },
      body: encodedBody,
    });

    expect(res.status).to.equal(409);
    const body = await res.json();
    expect(body.message).to.equal("oldChartVersion");
  });

  test("should return 415 for negative offset", async () => {
    const chartData = dummyChart();
    const invalidData = {
      ...chartData,
      offset: -1, // negative offset is invalid
    };
    const encodedBody = msgpack.encode(invalidData);

    const res = await app.request("/api/seqPreview?lvIndex=0", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
      },
      body: encodedBody,
    });

    expect(res.status).to.equal(415);
    const body = await res.json();
    expect(body.message).to.include("invalidChart");
  });

  test("should return 422 for out-of-range lvIndex", async () => {
    const chartData = dummyChart();
    const encodedBody = msgpack.encode(chartData);

    const res = await app.request("/api/seqPreview?lvIndex=99", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
      },
      body: encodedBody,
    });

    expect(res.status).to.equal(422);
    const body = await res.json();
    expect(body.message).to.equal("levelNotFound");
  });
});
