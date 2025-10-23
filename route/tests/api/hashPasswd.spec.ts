import { expect, test, describe } from "vitest";
import { hash } from "@falling-nikochan/chart";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "@falling-nikochan/route/src/api/chart";
import { app, initDb } from "./init";

describe("GET /api/hashPasswd/:cid", () => {
  test("should return hashed password and random pUserSalt", async () => {
    await initDb();
    const res = await app.request("/api/hashPasswd/100000?p=p");
    expect(res.status).toBe(200);
    const resHash = await res.text();
    const pUserSalt = res.headers
      .get("Set-Cookie")
      ?.split(";")[0]
      .split("=")[1];
    console.log(pUserSalt);
    expect(pUserSalt).toBeTypeOf("string");
    expect(pUserSalt).not.to.be.empty;

    let pServerHash: string;
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      pServerHash = (await (await client.connect())
        .db("nikochan")
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: "100000" }))!.pServerHash;
    } finally {
      client.close();
    }
    expect(resHash).toBe(await hash(pServerHash + pUserSalt));
  });
  test("should use same pUserSalt if it is set in the cookie", async () => {
    await initDb();
    const res = await app.request("/api/hashPasswd/100000?p=p", {
      headers: { Cookie: "pUserSalt=def" },
    });
    expect(res.status).toBe(200);
    const resHash = await res.text();
    const pUserSalt = res.headers
      .get("Set-Cookie")
      ?.split(";")[0]
      .split("=")[1];
    expect(pUserSalt).toBe("def");

    let pServerHash: string;
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
      pServerHash = (await (await client.connect())
        .db("nikochan")
        .collection<ChartEntryCompressed>("chart")
        .findOne({ cid: "100000" }))!.pServerHash;
    } finally {
      client.close();
    }
    expect(resHash).toBe(await hash(pServerHash + pUserSalt));
  });
  test("should return 400 for invalid cid", async () => {
    const res = await app.request("/api/hashPasswd/invalid?p=p");
    expect(res.status).toBe(400);
  });
  test("should return 404 for nonexistent cid", async () => {
    const res = await app.request("/api/hashPasswd/100002?p=p");
    expect(res.status).toBe(404);
  });
  test("should return 404 for deleted cid", async () => {
    const res = await app.request("/api/hashPasswd/100001?p=p");
    expect(res.status).toBe(404);
  });
});
