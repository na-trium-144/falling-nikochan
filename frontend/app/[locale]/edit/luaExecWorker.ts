import { luaExec } from "@falling-nikochan/chart/dist/luaExec";
import fnCommandsLib from "fn-commands?raw";

const worker = self as unknown as Worker;

export interface WorkerInput {
  code: string;
  options: {
    catchError?: boolean;
    needReturnValue?: boolean;
    isChartFile?: boolean;
  }
}

worker.addEventListener(
  "message",
  async ({ data }: MessageEvent<WorkerInput>) => {
    const result = await luaExec(
      process.env.ASSET_PREFIX + "/wasmoon_glue.wasm",
      fnCommandsLib,
      data.code,
      data.options,
    );
    worker.postMessage(result);
  }
);

worker.postMessage("initDone");
