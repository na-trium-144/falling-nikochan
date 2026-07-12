import {
  apiApp,
  redirectApp,
  sitemapApp,
  rssApp,
  shareApp,
  languageDetector,
  onError,
  notFound,
  reportPopularCharts,
  checkNewCharts,
  reportToDiscord,
  getBrief,
  sentryBeforeSend,
  discordInviteApp,
} from "@falling-nikochan/route";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { getConnInfo } from "hono/cloudflare-workers";
import * as Sentry from "@sentry/hono/cloudflare";
import packageJson from "@falling-nikochan/route/package.json" with { type: "json" };
import { MongoClient } from "mongodb";
import { createMiddleware } from "hono/factory";
import { compress } from "hono/compress";
import { structuredLogger } from "@hono/structured-logger";

const fetchStatic = (e, url) => e.ASSETS.fetch(url);
const sentryConfig = (env) => ({
  dsn: env.SENTRY_DSN,
  release: `${packageJson.version}-cf-${env.CF_VERSION_METADATA.id}`,
  environment: env.CF_VERSION_METADATA.tag,
  sendDefaultPii: false,
  normalizeDepth: 11,
  integrations: [Sentry.extraErrorDataIntegration({ depth: 10 })],
  beforeSend: sentryBeforeSend,
});
const sentryHonoConfig = (env) => ({
  ...sentryConfig(env),
  shouldHandleError: () => false,
});

const dbMiddleware = createMiddleware(async (c, next) => {
  let client = null;
  c.set("db", async () => {
    if (!client) {
      client = new MongoClient(env(c).MONGODB_URI);
      await client.connect();
    }
    return client.db("nikochan");
  });
  try {
    await next();
  } finally {
    if (client) {
      await client.close();
    }
  }
});
const fetchBrief = async (e, cid) => {
  const client = new MongoClient(e.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("nikochan");
    return await getBrief(db, cid);
  } finally {
    await client.close();
  }
};

const app = new Hono({ strict: false });
app.use(Sentry.sentry(app, sentryHonoConfig));
app
  .use(structuredLogger({ createLogger: () => console }))
  .use(async (c, next) => {
    await next();
    if (c.res.headers.has("content-encoding")) {
      // https://leaysgur.github.io/posts/2022/03/07/141253/
      // 既存のレスポンスの Body と Headers、Status を引き継ぎつつ、 encodeBody: "manual" を付与した新しい Response を作成
      c.res = new Response(c.res.body, {
        status: c.res.status,
        statusText: c.res.statusText,
        headers: c.res.headers,
        encodeBody: "manual",
      });
    }
  })
  .use(compress())
  .route("/api", await apiApp({ getConnInfo, dbMiddleware }))
  .get("/og/*", (c) => {
    const url = new URL(c.req.raw.url);
    return c.redirect(
      env(c).BACKEND_OG_PREFIX + url.pathname + url.search,
      307
    );
  })
  .route("/sitemap.xml", await sitemapApp({ dbMiddleware }))
  .route("/rss.xml", await rssApp({ dbMiddleware }))
  .route("/share", shareApp({ fetchBrief, fetchStatic }))
  .route("/discord", discordInviteApp)
  .route("/", redirectApp({ fetchStatic }))
  .use(languageDetector())
  .onError(
    onError({
      fetchStatic,
      captureException: Sentry.captureException,
      setTransactionName: (name) =>
        void Sentry.getCurrentScope().setTransactionName(name),
    })
  )
  .notFound(notFound);

export default Sentry.withSentry(sentryConfig, {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // オリジン（DNSで設定したサーバー）に丸投げする
    if (
      url.hostname === "nikochan.utcode.net" &&
      (url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/og/") ||
        url.pathname.startsWith("/sitemap.xml") ||
        url.pathname.startsWith("/rss.xml") ||
        url.pathname.startsWith("/share/"))
    ) {
      // fetch(request) と書くだけで、Workerを通さずオリジンにリクエストが飛びます
      try {
        const res = await fetch(request.clone());
        if (res.status < 500) {
          return res;
        } else {
          Sentry.captureException(
            new Error(
              `passthrough request to ${url.hostname} failed (${res.status})`
            ),
            {
              extra: {
                url: url,
                status: res.status,
                body: await res.text(),
              },
            }
          );
        }
      } catch (e) {
        Sentry.captureException(
          new Error(`passthrough request to ${url.hostname} failed`, {
            cause: e,
          }),
          {
            extra: {
              url: url,
            },
          }
        );
        // passthrough
      }
    }

    return app.fetch(request, env, ctx);
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      (async () => {
        try {
          await reportPopularCharts(env);
        } catch (e) {
          await reportToDiscord(
            env,
            "Uncaught exception in reportPopularCharts():\n" + String(e)
          );
        }
        try {
          await checkNewCharts(env);
        } catch (e) {
          await reportToDiscord(
            env,
            "Uncaught exception in checkNewCharts():\n" + String(e)
          );
        }
      })()
    );
  },
});
