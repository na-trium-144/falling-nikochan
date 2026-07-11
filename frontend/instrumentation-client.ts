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
  normalizeDepth: 11,
  integrations: [Sentry.extraErrorDataIntegration({ depth: 10 })],
  transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
  transportOptions: {
    dbName: "sentry-offline-main",
    flushAtStartup: true,
    // transportOptions type is not recognized correctly: https://github.com/getsentry/sentry-javascript/issues/13548
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  enabled: !isbot(navigator?.userAgent),
  ignoreErrors: [
    "Minified React error #418", // hydration failed
    // "ChunkLoadError:",
    "AbortError:",
  ],
  beforeSend(event, hint) {
    if (
      hint.originalException instanceof Error &&
      hint.originalException.name === "ChunkLoadError"
    ) {
      event.fingerprint = ["ChunkLoadError"];
    }
    if (hint.originalException instanceof APIError) {
      if (hint.originalException.expected) {
        return null;
      }
      event.fingerprint = hint.originalException.fingerprint;
    }
    if (event.transaction && /^\/share\/\d+$/.test(event.transaction)) {
      event.transaction = "/share/:cid";
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
