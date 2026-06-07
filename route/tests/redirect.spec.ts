import { describe, test } from "node:test";
import { expect } from "chai";
import redirectApp from "@falling-nikochan/route/src/redirect";
import { ResponseOK } from "../src/env";

const app = redirectApp({
  languageDetector: async (c, next) => {
    c.set("language", "ja");
    await next();
  },
  fetchStatic: () => {
    throw new Error("not implemented");
  },
});

describe("redirectApp", () => {
  test("should redirect deprecated /edit/:cid to /edit?cid=:cid", async () => {
    const res = await app.request("http://example.com/edit/123456");
    expect(res.status).to.equal(301);
    const location = new URL(res.headers.get("Location")!);
    expect(location.pathname).to.equal("/edit");
    expect(location.searchParams.get("cid")).to.equal("123456");
  });
  test("should redirect deprecated /edit/:cid to /edit?cid=:cid with other query preserved", async () => {
    const res = await app.request("http://example.com/edit/123456?foo=bar");
    expect(res.status).to.equal(301);
    const location = new URL(res.headers.get("Location")!);
    expect(location.pathname).to.equal("/edit");
    expect(location.searchParams.get("cid")).to.equal("123456");
    expect(location.searchParams.get("foo")).to.equal("bar");
  });

  test("should redirect deprecated /:lang/main/:sort to /:lang/main/play?sort=:sort", async () => {
    const res = await app.request("http://example.com/ja/main/latest");
    expect(res.status).to.equal(301);
    const location = new URL(res.headers.get("Location")!);
    expect(location.pathname).to.equal("/ja/main/play");
    expect(location.searchParams.get("sort")).to.equal("latest");
  });
  test("should redirect deprecated /:lang/main/:sort to /:lang/main/play?sort=:sort with other query preserved", async () => {
    const res = await app.request("http://example.com/ja/main/latest?foo=bar");
    expect(res.status).to.equal(301);
    const location = new URL(res.headers.get("Location")!);
    expect(location.pathname).to.equal("/ja/main/play");
    expect(location.searchParams.get("sort")).to.equal("latest");
    expect(location.searchParams.get("foo")).to.equal("bar");
  });

  test("should redirect deprecated /:lang/main/about/1 to /:lang with anchor", async () => {
    const res = await app.request("http://example.com/ja/main/about/1");
    expect(res.status).to.equal(301);
    const location = new URL(res.headers.get("Location")!);
    expect(location.pathname).to.equal("/ja");
    expect(location.hash).to.equal("#feature-play");
  });
  test("should redirect deprecated /:lang/main/about/4 to /:lang/main/about", async () => {
    const res = await app.request("http://example.com/ja/main/about/4");
    expect(res.status).to.equal(301);
    const location = new URL(res.headers.get("Location")!);
    expect(location.pathname).to.equal("/ja/main/about");
  });
  test("should redirect deprecated /:lang/main/about/1 to /:lang with anchor with other query preserved", async () => {
    const res = await app.request("http://example.com/ja/main/about/1?foo=bar");
    expect(res.status).to.equal(301);
    const location = new URL(res.headers.get("Location")!);
    expect(location.pathname).to.equal("/ja");
    expect(location.hash).to.equal("#feature-play");
    expect(location.searchParams.get("foo")).to.equal("bar");
  });
  test("should redirect deprecated /:lang/main/about/4 to /:lang/main/about with other query preserved", async () => {
    const res = await app.request("http://example.com/ja/main/about/4?foo=bar");
    expect(res.status).to.equal(301);
    const location = new URL(res.headers.get("Location")!);
    expect(location.pathname).to.equal("/ja/main/about");
    expect(location.searchParams.get("foo")).to.equal("bar");
  });

  test("should 307 redirect play route with language prefix", async () => {
    const res = await app.request("http://example.com/play");
    expect(res.status).to.equal(307);
    const location = new URL(res.headers.get("Location")!);
    expect(location.pathname).to.equal("/ja/play");
  });
  test("should 307 redirect play route with language prefix with query preserved", async () => {
    const res = await app.request("http://example.com/play?cid=100000");
    expect(res.status).to.equal(307);
    const location = new URL(res.headers.get("Location")!);
    expect(location.pathname).to.equal("/ja/play");
    expect(location.searchParams.get("cid")).to.equal("100000");
  });

  test("should return static response for bot requests when fetchStatic succeeds", async () => {
    const botApp = redirectApp({
      languageDetector: async (c, next) => {
        c.set("language", "en");
        await next();
      },
      fetchStatic: (_e, url) =>
        Promise.resolve(
          new Response(`fetched:${url.pathname}`, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          }) as ResponseOK
        ),
    });

    const res = await botApp.request("http://example.com/play", {
      headers: { "User-Agent": "Googlebot" },
    });
    expect(res.status).to.equal(200);
    expect(res.headers.get("Content-Type")).to.equal("text/plain");
    expect(res.headers.get("Cache-Control")).to.equal("no-store");
    expect(await res.text()).to.equal("fetched:/en/play");
  });
});
