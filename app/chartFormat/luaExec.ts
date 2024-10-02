import { LuaFactory } from "wasmoon";
import { Chart } from "./chart";

interface Result {
  stdout: string[];
  err: string;
}
export async function luaExec(code: string): Promise<Result> {
  const factory = new LuaFactory();
  const lua = await factory.createEngine();
  const result: Result = { stdout: [], err: "" };
  try {
    lua.global.set("print", (...args: any[]) => {
      result.stdout.push(args.map((a) => String(a)).join("\t"));
    });
    // lua.global.set('sum', (x, y) => x + y)
    await lua.doString(code);
  } catch (e) {
    result.err = String(e);
  } finally {
    lua.global.close();
  }
  return result;
}
