import { test, describe } from "node:test";
import { expect } from "chai";
import { hash } from "@falling-nikochan/chart";
import { MongoClient } from "mongodb";
import { ChartEntryCompressed } from "@falling-nikochan/route/src/api/chart";
import { app, initDb } from "./init";

const encodeBase64Utf8 = (value: string) =>
  btoa(
    Array.from(new TextEncoder().encode(value), (byte) =>
      String.fromCodePoint(byte)
    ).join("")
  );
const basicAuth = (passwd: string) =>
  `Nikochan-Basic ${encodeBase64Utf8(passwd)}`;
const getServerHash = async () => {
  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    return (await (await client.connect())
      .db("nikochan")
      .collection<ChartEntryCompressed>("chart")
      .findOne({ cid: "100000" }))!.pServerHash;
  } finally {
    client.close();
  }
};

describe("GET /api/hashPasswd/:cid", () => {
  test("should return hashed password and random pUserSalt", async () => {
    await initDb();
    const res = await app.request("/api/hashPasswd/100000?p=p");
    expect(res.status).to.equal(200);
    const resHash = await res.text();
    const pUserSalt = res.headers
      .get("Set-Cookie")
      ?.split(";")[0]
      .split("=")[1];
    console.log(pUserSalt);
    expect(pUserSalt).to.be.a("string");
    expect(pUserSalt).not.to.be.empty;

    const pServerHash = await getServerHash();
    expect(resHash).to.equal(await hash(pServerHash + pUserSalt));
  });
  test("should return hashed password when Authorization header is provided", async () => {
    await initDb();
    const res = await app.request("/api/hashPasswd/100000", {
      headers: { Authorization: basicAuth("p") },
    });
    expect(res.status).to.equal(200);
    const resHash = await res.text();
    const pUserSalt = res.headers
      .get("Set-Cookie")
      ?.split(";")[0]
      .split("=")[1];
    expect(pUserSalt).to.be.a("string");
    expect(pUserSalt).not.to.be.empty;

    const pServerHash = await getServerHash();
    expect(resHash).to.equal(await hash(pServerHash + pUserSalt));
  });
  test("should use same pUserSalt if it is set in the cookie", async () => {
    await initDb();
    const res = await app.request("/api/hashPasswd/100000?p=p", {
      headers: { Cookie: "pUserSalt=def" },
    });
    expect(res.status).to.equal(200);
    const resHash = await res.text();
    const pUserSalt = res.headers
      .get("Set-Cookie")
      ?.split(";")[0]
      .split("=")[1];
    expect(pUserSalt).to.equal("def");

    const pServerHash = await getServerHash();
    expect(resHash).to.equal(await hash(pServerHash + pUserSalt));
  });
  test("should return 400 for invalid cid", async () => {
    const res = await app.request("/api/hashPasswd/invalid?p=p");
    expect(res.status).to.equal(400);
    const body = await res.json();
    expect(body.message).to.equal("badRequest");
    expect(body.flattened.nested.cid[0]).to.be.a("string");
  });
  test("should return 404 for nonexistent cid", async () => {
    const res = await app.request("/api/hashPasswd/100002?p=p");
    expect(res.status).to.equal(404);
  });
  test("should return 404 for deleted cid", async () => {
    const res = await app.request("/api/hashPasswd/100001?p=p");
    expect(res.status).to.equal(404);
  });
});
