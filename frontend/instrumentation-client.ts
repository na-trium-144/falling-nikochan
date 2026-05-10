import * as Sentry from "@sentry/nextjs";

// Sentryの初期化箇所はここ以外に app/[locale]/edit/luaExecWorker.ts にもあるので注意！(そちらも同様に編集すること)

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.SENTRY_RELEASE,
  sendDefaultPii: false,
  enabled: process.env.NODE_ENV !== "development",
  integrations: [Sentry.extraErrorDataIntegration({ depth: 10 })],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
