import { APIError } from "@/common/apiError";
import * as Sentry from "@sentry/nextjs";

// Sentryの初期化箇所はここ以外に app/[locale]/edit/luaExecWorker.ts にもあるので注意！(そちらも同様に編集すること)

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tunnel: process.env.SENTRY_TUNNEL || undefined,
  release: process.env.SENTRY_RELEASE,
  environment: (process.env.TITLE_SUFFIX || "production").toLowerCase(),
  sendDefaultPii: false,
  integrations: [Sentry.extraErrorDataIntegration({ depth: 10 })],
  transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
  transportOptions: {
    dbName: "sentry-offline-main",
    flushAtStartup: true,
    // transportOptions type is not recognized correctly: https://github.com/getsentry/sentry-javascript/issues/13548
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  beforeSend(event, hint) {
    if (
      hint.syntheticException instanceof DOMException &&
      hint.syntheticException.name === "AbortError"
    ) {
      return null;
    }
    if (hint.syntheticException instanceof APIError) {
      if (hint.syntheticException.expected) {
        return null;
      }
      event.fingerprint = hint.syntheticException.fingerprint;
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
