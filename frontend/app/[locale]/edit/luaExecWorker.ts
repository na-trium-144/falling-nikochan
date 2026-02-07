import { luaExec } from "@falling-nikochan/chart/dist/luaExec";

const worker = self as unknown as Worker;

interface WorkerInput {
  code: string;
  catchError: boolean;
}

worker.addEventListener(
  "message",
  async ({ data }: MessageEvent<WorkerInput>) => {
    const result = await luaExec(
      process.env.ASSET_PREFIX + "/wasmoon_glue.wasm",
      data.code,
      { catchError: data.catchError, needReturnValue: false }
    );
    worker.postMessage(result);
  }
);
