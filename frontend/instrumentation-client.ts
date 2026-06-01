import { APIError } from "@/common/apiError";
import * as Sentry from "@sentry/nextjs";
import { isbot } from "isbot";

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
  enabled: !isbot(navigator?.userAgent),
  beforeSend(event, hint) {
    for (const [errorClass, name] of [
      [Error, "ChunkLoadError"],
      [DOMException, "AbortError"],
    ] as [() => unknown, string][]) {
      if (
        hint.originalException instanceof errorClass &&
        (hint.originalException as Error).name === name
      ) {
        return null;
      }
    }
    if (hint.originalException instanceof APIError) {
      if (hint.originalException.expected) {
        return null;
      }
      event.fingerprint = hint.originalException.fingerprint;
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
