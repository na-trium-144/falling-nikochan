import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    sendDefaultPii: process.env.SENTRY_SEND_PII === "true",
    // Replay は必要に応じて有効化してください
    // integrations: [Sentry.replayIntegration()],
    // tracesSampleRate: 1.0,
    // replaysSessionSampleRate: 0.1,
    // replaysOnErrorSampleRate: 1.0,
  });
}
