import { luaExec } from "@falling-nikochan/chart/dist/luaExec";
import fnCommandsLib from "fn-commands?raw";
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.SENTRY_RELEASE,
  sendDefaultPii: false,
  enabled: process.env.NODE_ENV !== "development",
  integrations: [Sentry.extraErrorDataIntegration({ depth: 10 })],
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
