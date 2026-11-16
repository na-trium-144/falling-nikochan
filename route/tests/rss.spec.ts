import { describe, test } from "node:test";
import { expect } from "chai";
import { dbMiddleware, initDb } from "./api/init";
import { rssApp } from "../src";

const app = await rssApp({ dbMiddleware });

describe("rssApp", () => {
  test("should return 200", async () => {
    await initDb();
    const res = await app.request("/");
    expect(res.status).to.equal(200);
    expect(res.headers.get("content-type")).to.include("xml");
    const body = await res.text();
    expect(body).to.include("<rss");
  });
});
