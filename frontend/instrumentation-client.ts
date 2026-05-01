import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.SENTRY_RELEASE,
  sendDefaultPii: !!process.env.SENTRY_SEND_PII,
  enabled: process.env.NODE_ENV !== "development",
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
