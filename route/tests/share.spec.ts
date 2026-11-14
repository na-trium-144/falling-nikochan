import { describe, test } from "node:test";
import { expect } from "chai";
import { dummyChart, fetchBrief, initDb, testFetchStatic } from "./api/init";
import { onError } from "../src/error";
import { Bindings, resultSecretKey } from "../src/env";
import {
  resultSerialized,
  testResultParams,
} from "./api/resultSigning.verify.get.spec";
import { serializeResultParamsLegacy } from "@falling-nikochan/chart";
import { structuredLogger } from "@hono/structured-logger";
import { Hono } from "hono";
import { shareApp } from "../src";

const app = new Hono<{ Bindings: Bindings }>({ strict: false });
app
  .use(
    structuredLogger({
      createLogger: () => console,
      onRequest: () => undefined,
      onResponse: () => undefined,
    })
  )
  .route(
    "/share/",
    shareApp({
      fetchBrief,
      fetchStatic: testFetchStatic,
    })
  )
  .onError(
    onError({
      fetchStatic: testFetchStatic,
      isTest: true,
      captureException: null,
      setTransactionName: null,
    })
  );

function escapeHtml(str: string): string {
  let htmlStr = "";
  for (const codePoint of str) {
    htmlStr += "&#" + codePoint.codePointAt(0) + ";";
  }
  return htmlStr;
}

const descriptionsForLang: Record<string, string> = {
  "en": "Play the chart of",
  "ja": "の譜面をプレイしよう。",
};
const descriptionsWithResultForLang: Record<string, string> = {
  "en": "Played the chart (",
  "ja": "のプレイ記録",
};

async function validResultParam() {
  const key = await resultSecretKey(process.env as any);
  const signature = await crypto.subtle.sign(
    { name: "HMAC", hash: { name: "SHA-256" } },
    key,
    Buffer.from(resultSerialized, "base64url")
  );
  const signatureBase64Url = Buffer.from(signature.slice(0, 12)).toString(
    "base64url"
  );
  const param = `${resultSerialized}.${signatureBase64Url}`;
  return param;
}

describe("shareApp", () => {
  test("should return en html whose placeholders are replaced with chart data", async () => {
    await initDb();
    const res = await app.request("/share/100000");
    expect(res.status).to.equal(200);
    const body = await res.text();
    expect(body).to.include("/share/100000");
    expect(body).to.include("/og/share/100000");
    expect(body).to.include(escapeHtml(dummyChart().title));
    expect(body).to.include(escapeHtml(dummyChart().chartCreator));
    expect(body).to.include(escapeHtml(descriptionsForLang["en"]));
    // this is body from frontend html
    expect(body).to.include(`<body class="fn-body">`);
    expect(body).to.include(`<html lang="en">`);
  });

  test("should return en html with result data", async () => {
    await initDb();
    const res2 = await app.request(
      `/share/100000?result=${encodeURIComponent(await validResultParam())}`
    );
    expect(res2.status).to.equal(200);
    const body2 = await res2.text();
    expect(body2).to.include("/share/100000");
    expect(body2).to.include("/og/result/100000");
    expect(body2).to.include(escapeHtml(dummyChart().title));
    expect(body2).to.include(escapeHtml(dummyChart().chartCreator));
    expect(body2).to.include(escapeHtml(descriptionsWithResultForLang["en"]));
    // this is body from frontend html
    expect(body2).to.include(`<body class="fn-body">`);
    expect(body2).to.include(`<html lang="en">`);
  });

  test("should return en html on unsupported lang", async () => {
    await initDb();
    const res = await app.request("/share/100000?lang=foo");
    expect(res.status).to.equal(200);
    const body = await res.text();
    expect(body).to.include(escapeHtml(descriptionsForLang["en"]));
    expect(body).to.include(`<body class="fn-body">`);
    expect(body).to.include(`<html lang="en">`);

    const res2 = await app.request(
      `/share/100000?lang=foo&result=${encodeURIComponent(await validResultParam())}`
    );
    expect(res2.status).to.equal(200);
    const body2 = await res2.text();
    expect(body2).to.include(escapeHtml(descriptionsWithResultForLang["en"]));
    expect(body2).to.include(`<body class="fn-body">`);
    expect(body2).to.include(`<html lang="en">`);
  });

  for (const lang of ["en", "ja"]) {
    test(`should return ${lang} html when Accept-Language is ${lang}`, async () => {
      await initDb();
      const res = await app.request("/share/100000", {
        headers: {
          "Accept-Language": lang,
        },
      });
      expect(res.status).to.equal(200);
      const body = await res.text();
      expect(body).to.include(escapeHtml(descriptionsForLang[lang]));
      expect(body).to.include(`<body class="fn-body">`);
      expect(body).to.include(`<html lang="${lang}">`);

      const res2 = await app.request(
        `/share/100000?result=${encodeURIComponent(await validResultParam())}`,
        {
          headers: {
            "Accept-Language": lang,
          },
        }
      );
      expect(res2.status).to.equal(200);
      const body2 = await res2.text();
      expect(body2).to.include(escapeHtml(descriptionsWithResultForLang[lang]));
      expect(body2).to.include(`<body class="fn-body">`);
      expect(body2).to.include(`<html lang="${lang}">`);
    });
    test(`should return ${lang} html when Accept-Language and lang query is both ${lang}`, async () => {
      await initDb();
      const res = await app.request(`/share/100000?lang=${lang}`, {
        headers: {
          "Accept-Language": lang,
        },
      });
      expect(res.status).to.equal(200);
      const body = await res.text();
      expect(body).to.include(escapeHtml(descriptionsForLang[lang]));
      expect(body).to.include(`<body class="fn-body">`);
      expect(body).to.include(`<html lang="${lang}">`);

      const res2 = await app.request(
        `/share/100000?lang=${lang}&result=${encodeURIComponent(await validResultParam())}`,
        {
          headers: {
            "Accept-Language": lang,
          },
        }
      );
      expect(res2.status).to.equal(200);
      const body2 = await res2.text();
      expect(body2).to.include(escapeHtml(descriptionsWithResultForLang[lang]));
      expect(body2).to.include(`<body class="fn-body">`);
      expect(body2).to.include(`<html lang="${lang}">`);
    });
  }
  for (const lang of ["en", "ja"]) {
    for (const qLang of ["en", "ja"]) {
      if (lang !== qLang) {
        test(`should return ${qLang} soft redirect page if Accept-Language is ${lang} and lang query is ${qLang}`, async () => {
          await initDb();
          const res = await app.request(`/share/100000?lang=${qLang}`, {
            headers: {
              "Accept-Language": lang,
            },
          });
          expect(res.status).to.equal(200);
          const body = await res.text();
          expect(body).to.include(escapeHtml(descriptionsForLang[qLang]));
          expect(body).to.not.include(escapeHtml(descriptionsForLang[lang]));

          expect(body).to.not.include(`<body class="fn-body">`);

          const res2 = await app.request(
            `/share/100000?lang=${qLang}&result=${encodeURIComponent(await validResultParam())}`,
            {
              headers: {
                "Accept-Language": lang,
              },
            }
          );
          expect(res2.status).to.equal(200);
          const body2 = await res2.text();
          expect(body2).to.include(
            escapeHtml(descriptionsWithResultForLang[qLang])
          );
          expect(body2).to.not.include(
            escapeHtml(descriptionsWithResultForLang[lang])
          );
          expect(body2).to.not.include(`<body class="fn-body">`);
        });
      }
    }
  }

  test("should return html without result for tampered signature", async () => {
    await initDb();

    const param = `${resultSerialized}.invalidSignature`;

    const res2 = await app.request(
      `/share/100000?result=${encodeURIComponent(param)}`
    );
    expect(res2.status).to.equal(200);
    const body2 = await res2.text();
    expect(body2).to.not.include(
      escapeHtml(descriptionsWithResultForLang["en"])
    );
    expect(body2).to.include(escapeHtml(descriptionsForLang["en"]));
    expect(body2).to.include(`<body class="fn-body">`);
  });

  test("should return html with result for legacy result version (ver < 4)", async () => {
    await initDb();

    const legacySerialized = serializeResultParamsLegacy(testResultParams);
    const res2 = await app.request(
      `/share/100000?result=${encodeURIComponent(legacySerialized)}`
    );
    expect(res2.status).to.equal(200);
    const body2 = await res2.text();
    expect(body2).to.include(escapeHtml(descriptionsWithResultForLang["en"]));
    expect(body2).to.not.include(escapeHtml(descriptionsForLang["en"]));
    expect(body2).to.include(`<body class="fn-body">`);
  });

  test("should return html without result for invalid result parameter", async () => {
    await initDb();

    const res2 = await app.request(`/share/100000?result=invalid-param`);
    expect(res2.status).to.equal(200);
    const body2 = await res2.text();
    expect(body2).to.not.include(
      escapeHtml(descriptionsWithResultForLang["en"])
    );
    expect(body2).to.include(escapeHtml(descriptionsForLang["en"]));
    expect(body2).to.include(`<body class="fn-body">`);
  });

  test("should return 404 for nonexistent cid", async () => {
    await initDb();
    const res = await app.request("/share/100002");
    expect(res.status).to.equal(404);
  });
  test("should return 404 for deleted cid", async () => {
    await initDb();
    const res = await app.request("/share/100001");
    expect(res.status).to.equal(404);
  });
  // test("should return 400 for invalid cid", async () => {
  //   await initDb();
  //   const res = await app.request("/share/invalid");
  //   expect(res.status).to.equal(400);
  // });
});
