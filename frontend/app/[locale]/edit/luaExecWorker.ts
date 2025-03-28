import { luaExec } from "@falling-nikochan/chart";

const worker = self as unknown as Worker;

interface WorkerInput {
  code: string;
  catchError: boolean;
}

worker.addEventListener(
  "message",
  async ({ data }: MessageEvent<WorkerInput>) => {
    const result = await luaExec(
      process.env.ASSET_PREFIX + "/assets/wasmoon_glue.wasm",
      data.code,
      data.catchError
    );
    worker.postMessage(result);
  }
);
