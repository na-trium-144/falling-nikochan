import { luaExec } from "@falling-nikochan/chart/dist/luaExec";
import fnCommandsLib from "fn-commands?raw";
import * as Sentry from "@sentry/browser";
import { isbot } from "isbot";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tunnel: process.env.SENTRY_TUNNEL || undefined,
  release: process.env.SENTRY_RELEASE,
  environment: (process.env.TITLE_SUFFIX || "production").toLowerCase(),
  sendDefaultPii: false,
  integrations: [Sentry.extraErrorDataIntegration({ depth: 10 })],
  transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
  transportOptions: {
    dbName: "sentry-offline-luaExecWorker",
    flushAtStartup: true,
    // transportOptions type is not recognized correctly: https://github.com/getsentry/sentry-javascript/issues/13548
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  enabled: !isbot(navigator?.userAgent),
  beforeSend(event /*, hint*/) {
    return event;
  },
});

const worker = self as unknown as Worker;

export interface WorkerInput {
  code: string;
}

worker.addEventListener(
  "message",
  async ({ data }: MessageEvent<WorkerInput>) => {
    const result = await luaExec(
      process.env.ASSET_PREFIX + "/wasmoon_glue.wasm",
      fnCommandsLib,
      data.code,
      { catchError: true, needReturnValue: false }
    );
    worker.postMessage(result);
  }
);
