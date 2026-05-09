import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.SENTRY_RELEASE,
  enabled: process.env.NODE_ENV !== "development",
  integrations: [Sentry.extraErrorDataIntegration({ depth: 10 })],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
