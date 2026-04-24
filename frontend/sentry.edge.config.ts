import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: process.env.SENTRY_RELEASE,
    sendDefaultPii: process.env.SENTRY_SEND_PII === "true",
  });
}
