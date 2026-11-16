import { describe, test } from "node:test";
import { expect } from "chai";
import { dbMiddleware, initDb } from "./api/init";
import { sitemapApp } from "../src";

const app = await sitemapApp({ dbMiddleware });

describe("sitemapApp", () => {
  test("should return 200", async () => {
    await initDb();
    const res = await app.request("/");
    expect(res.status).to.equal(200);
    expect(res.headers.get("content-type")).to.include("xml");
    const body = await res.text();
    expect(body).to.include("<urlset");
    expect(body).to.include("<url>");
    expect(body).to.include("<loc>");
  });
});
