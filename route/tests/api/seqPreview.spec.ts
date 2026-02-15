import { test, describe } from "node:test";
import { expect } from "chai";
import { app, dummyLevel15 } from "./init";
import { ChartSeqData, loadChart } from "@falling-nikochan/chart";
import msgpack from "@msgpack/msgpack";

describe("POST /api/seqPreview", () => {
  test("should return ChartSeqData from valid Level15Play data", async () => {
    const levelData = dummyLevel15();
    const encodedBody = msgpack.encode(levelData);
    
    const res = await app.request("/api/seqPreview", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
      },
      body: encodedBody,
    });
    
    expect(res.status).to.equal(200);
    expect(res.headers.get("Content-Type")).to.equal("application/vnd.msgpack");
    expect(res.headers.get("Content-Disposition")).to.include("preview.fnseq.mpk");
    
    const seqData = msgpack.decode(await res.arrayBuffer()) as ChartSeqData;
    expect(seqData.notes).to.deep.equal(loadChart(dummyLevel15()).notes);
  });

  test("should return 400 for invalid msgpack", async () => {
    const invalidBody = new Uint8Array([0xff, 0xfe, 0xfd]);
    
    const res = await app.request("/api/seqPreview", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
      },
      body: invalidBody,
    });
    
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.message).to.include("msgpack");
  });

  test("should return 400 for invalid Level15Play data (missing required fields)", async () => {
    const invalidData = {
      ver: 15,
      // missing required fields like offset, notes, etc.
    };
    const encodedBody = msgpack.encode(invalidData);
    
    const res = await app.request("/api/seqPreview", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
      },
      body: encodedBody,
    });
    
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.message).to.include("Validation error");
  });

  test("should return 400 for invalid ver field", async () => {
    const levelData = dummyLevel15();
    const invalidData = {
      ...levelData,
      ver: 14, // wrong version
    };
    const encodedBody = msgpack.encode(invalidData);
    
    const res = await app.request("/api/seqPreview", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
      },
      body: encodedBody,
    });
    
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.message).to.include("Validation error");
  });

  test("should return 400 for negative offset", async () => {
    const levelData = dummyLevel15();
    const invalidData = {
      ...levelData,
      offset: -1, // negative offset is invalid
    };
    const encodedBody = msgpack.encode(invalidData);
    
    const res = await app.request("/api/seqPreview", {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.msgpack",
      },
      body: encodedBody,
    });
    
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.message).to.include("Validation error");
  });
});
