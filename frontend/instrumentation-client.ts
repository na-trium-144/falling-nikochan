import * as Sentry from "@sentry/nextjs";

// Sentryの初期化箇所はここ以外に app/[locale]/edit/luaExecWorker.ts にもあるので注意！(そちらも同様に編集すること)

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.SENTRY_RELEASE,
  environment: (process.env.TITLE_SUFFIX || "production").toLowerCase(),
  sendDefaultPii: false,
  integrations: [Sentry.extraErrorDataIntegration({ depth: 10 })],
  transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
  transportOptions: {
    dbName: "sentry-offline-main",
    // transportOptions type is not recognized correctly: https://github.com/getsentry/sentry-javascript/issues/13548
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
