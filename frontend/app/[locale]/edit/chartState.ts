import * as Sentry from "@sentry/nextjs";
import {
  getPasswd,
  preferSavePasswd,
  setPasswd,
  unsetPasswd,
} from "@/common/passwdCache";
import {
  ChartEdit,
  emptyChart,
  validateChart,
  validateChartMin,
  ChartEditing,
  LuaExecutor,
  ChartUntil14,
  ChartUntil14Min,
  CurrentPasswd,
  Chart14Min,
  chartToLuaTableCode,
  findLuaLevelCode,
  Chart14Edit,
  convertToLatest,
  updateBpmTimeSec,
  updateBarNum,
  rateLimit,
} from "@falling-nikochan/chart";
import { useCallback, useEffect, useRef, useState } from "react";
import * as msgpack from "@msgpack/msgpack";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import saveAs from "file-saver";
import YAML from "yaml";
import { luaExec } from "@falling-nikochan/chart/dist/luaExec";
import { isStandalone } from "@/common/pwaInstall";
import * as v from "valibot";
import fnCommandsLib from "fn-commands?raw";
import fnCommandsPackageJson from "fn-commands/package.json";
import { isInsideFrame } from "@/scale";
import { captureAndWrap, fetchBackend } from "@/common/fetch";
import { retry } from "wretch/middlewares";
import { markAsExpected } from "@/common/apiError";

interface Props {
  onLoad: (cid: string) => void;
  locale: string;
  luaExecutor: LuaExecutor;
}

export type ChartAndState =
  | {
      chart: ChartEditing;
      state: "ok";
    }
  | {
      state:
        | undefined
        | "loading"
        | "passwdFailedSilent"
        | "passwdFailed"
        | "rateLimited"
        | Error;
    };
export type LoadState = ChartAndState["state"];
export class LocalLoadError {
  message: string;
  constructor(message: string) {
    this.message = message;
  }
}
export type LocalLoadState = undefined | "loading" | "ok" | LocalLoadError;
export type SaveState = undefined | "saving" | "ok" | Error;
interface EditSession {
  cid: string | undefined;
  currentPasswd: CurrentPasswd;
  chart: ChartEdit;
  convertedFrom: number;
  currentLevelIndex: number | undefined;
  hasChange: boolean;
  savePasswd: boolean;
}
export interface FetchChartOptions {
  isFirst?: boolean;
  bypass?: boolean;
  editPasswd: string;
  savePasswd: boolean;
}

function chartFileRetryMiddleware() {
  return retry({
    delayTimer: rateLimit.chartFile * 1000 + 500,
    delayRamp: (delay) => delay,
    maxAttempts: 3,
    until: (response) => !response || response.status !== 429,
    resolveWithLatestResponse: true,
  });
}

async function prepareRequestBody(body: Uint8Array<ArrayBuffer>): Promise<{
  body: Uint8Array<ArrayBuffer>;
  isCompressed: boolean;
}> {
  if (typeof CompressionStream === "undefined") {
    return { body, isCompressed: false };
  }
  const compressedBody = await new Response(
    new Blob([body]).stream().pipeThrough(new CompressionStream("gzip"))
  ).arrayBuffer();
  return {
    body: new Uint8Array(compressedBody),
    isCompressed: true,
  };
}
const encodeBase64Utf8 = (value: string) => {
  return btoa(
    Array.from(new TextEncoder().encode(value), (byte) =>
      String.fromCodePoint(byte)
    ).join("")
  );
};
const basicAuthorization = (passwd: string) =>
  `Nikochan-Basic ${encodeBase64Utf8(passwd)}`;
const chartAuthorization = (currentPasswd: CurrentPasswd) => {
  if (currentPasswd.pbypass) {
    return `Nikochan-Bypass ${currentPasswd.pbypass}`;
  }
  if (currentPasswd.p) {
    return basicAuthorization(currentPasswd.p);
  }
  if (currentPasswd.ph) {
    return `Nikochan-Hash ${currentPasswd.ph}`;
  }
  return undefined;
};

export function useChartState(props: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_rerenderIndex, setRerenderIndex] = useState<number>(0);
  const rerender = useCallback(() => setRerenderIndex((i) => i + 1), []);

  const [chartState, setChartState] = useState<ChartAndState>({
    state: undefined,
  });
  useEffect(() => {
    if (chartState.state === "ok") {
      chartState.chart.on("rerender", rerender);
      return () => {
        chartState.chart.off("rerender", rerender);
      };
    }
  }, [chartState, rerender]);

  const t = useTranslations("edit");
  const router = useRouter();

  const { onLoad, locale } = props;
  const onLoadRef = useRef<(cid: string) => void>(null!);
  onLoadRef.current = onLoad;

  const luaExecutorRef = useRef<LuaExecutor>(null!);
  luaExecutorRef.current = props.luaExecutor;

  const [savePasswd, setSavePasswd] = useState<boolean>(false);

  const fetchChart = useCallback(
    async (cid: string, options: FetchChartOptions) => {
      setChartState({ state: "loading" });
      setSavePasswd(options.savePasswd);

      const initialPasswd: CurrentPasswd = {
        p: options.editPasswd || null,
        ph: getPasswd(cid),
        pbypass: options.bypass ? "1" : null,
      };
      const result = await fetchBackend()
        .url(`/api/chartFile/${cid}`)
        .options({
          cache: "no-store",
          credentials:
            process.env.NODE_ENV === "development" ? "include" : "same-origin",
        })
        .auth(chartAuthorization(initialPasswd) ?? "")
        .middlewares([chartFileRetryMiddleware()])
        .get()
        // passwdPrompt has unique handler for 401 and 429 messages
        .unauthorized(
          () =>
            ({
              state: options.isFirst ? "passwdFailedSilent" : "passwdFailed",
            }) as const
        )
        .error(429, () => ({ state: "rateLimited" }) as const)
        .badRequest(markAsExpected)
        .notFound(markAsExpected)
        .arrayBuffer(async (buf) => {
          const chartRes = msgpack.decode(buf) as ChartUntil14;
          let updatedPh: string | undefined = undefined;
          if (options.savePasswd) {
            if (options.editPasswd) {
              updatedPh = await fetchBackend()
                .url(`/api/hashPasswd/${cid}`)
                .options({
                  credentials:
                    process.env.NODE_ENV === "development"
                      ? "include"
                      : "same-origin",
                })
                .auth(basicAuthorization(options.editPasswd) ?? "")
                .get()
                .badRequest(() => undefined)
                .notFound(() => undefined)
                .text()
                .catch((e: unknown) => {
                  Sentry.captureException(e);
                  console.error(e);
                  return undefined; // ignore error and continue
                });
              if (updatedPh) {
                setPasswd(cid, updatedPh);
              }
            }
          } else {
            /* パスワード保存のチェックが外れたときに保存済みパスワードを消す処理だが、PR#973でコメントアウトされている。
            issue#971:
              ある譜面に「パスワードを保存する」のチェックを外してパスワードを入力すると、
              すでにパスワードを保存済みの別の譜面を読み込んだ際に
              「パスワードを保存する」がオフ かつ 保存済みパスワードを使って譜面をロードした 状態になり、バグる
            (...つまりどういうこと?)
            */
            // unsetPasswd(cid);
          }

          const finalPasswd: CurrentPasswd = {
            ...initialPasswd,
            ...(updatedPh ? { ph: updatedPh } : {}),
          };
          const chart = new ChartEditing(await validateChart(chartRes), {
            luaExecutorRef,
            locale,
            cid,
            currentPasswd: finalPasswd,
            convertedFrom: chartRes.ver,
          });
          return {
            chart,
            state: "ok" as const,
          };
        })
        .catch((e: unknown) => ({ state: captureAndWrap(e, { cid }) }));

      if (result.state === "ok") {
        onLoadRef.current(cid);
      }
      setChartState(result);
    },
    [locale]
  );

  const [saveState, setSaveState] = useState<SaveState>(undefined);
  const remoteSave = useCallback<() => Promise<void>>(async () => {
    if (chartState.state === "ok") {
      const onSave = async (cid: string) => {
        let currentPasswd = {
          ...chartState.chart.currentPasswd,
          ...(chartState.chart.changePasswd
            ? { p: chartState.chart.changePasswd }
            : {}),
        };
        if (savePasswd) {
          if (currentPasswd.p) {
            const updatedPh = await fetchBackend()
              .url(`/api/hashPasswd/${cid}`)
              .options({
                credentials:
                  process.env.NODE_ENV === "development"
                    ? "include"
                    : "same-origin",
              })
              .auth(basicAuthorization(currentPasswd.p))
              .get()
              .unauthorized(() => undefined)
              .notFound(() => undefined)
              .text()
              .catch((e: unknown) => {
                Sentry.captureException(e);
                console.error(e);
                return undefined; // ignore error and continue
              });
            if (updatedPh) {
              setPasswd(cid, updatedPh);
              currentPasswd = {
                ...currentPasswd,
                ph: updatedPh,
              };
            }
          }
        } else {
          unsetPasswd(cid);
        }
        chartState.chart.resetOnSave(cid, currentPasswd);
      };

      setSaveState("saving");
      const { body: requestBody, isCompressed } = await prepareRequestBody(
        msgpack.encode(chartState.chart.toObject())
      );
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/vnd.msgpack",
      };
      if (isCompressed) {
        requestHeaders["Content-Encoding"] = "gzip";
      }
      if (chartState.chart.cid === undefined) {
        await fetchBackend()
          .url(`/api/newChartFile`)
          .headers(requestHeaders)
          .body(requestBody)
          .options({
            cache: "no-store",
            credentials:
              process.env.NODE_ENV === "development"
                ? "include"
                : "same-origin",
          })
          .post()
          .notFound(markAsExpected)
          .error(409, markAsExpected)
          .error(413, markAsExpected)
          .error(429, markAsExpected)
          .json(async (res) => {
            const resBody = v.parse(v.object({ cid: v.string() }), res);
            onLoadRef.current(resBody.cid);
            await onSave(resBody.cid);
            return "ok" as const;
          })
          .catch((e: unknown) => captureAndWrap(e))
          .then((result) => setSaveState(result));
      } else {
        await fetchBackend()
          .url(`/api/chartFile/${chartState.chart.cid}`)
          .headers(requestHeaders)
          .body(requestBody)
          .options({
            cache: "no-store",
            credentials:
              process.env.NODE_ENV === "development"
                ? "include"
                : "same-origin",
          })
          .auth(chartAuthorization(chartState.chart.currentPasswd) ?? "")
          .middlewares([chartFileRetryMiddleware()])
          .post()
          .unauthorized(markAsExpected)
          .notFound(markAsExpected)
          .error(409, markAsExpected)
          .error(413, markAsExpected)
          .error(429, markAsExpected)
          .res(async () => {
            await onSave(chartState.chart.cid!);
            return "ok" as const;
          })
          .catch((e: unknown) =>
            captureAndWrap(e, { cid: chartState.chart.cid })
          )
          .then((result) => setSaveState(result));
      }
    } else {
      throw new Error("chart is empty");
    }
  }, [chartState, savePasswd]);

  const remoteDelete = useCallback<() => Promise<void>>(async () => {
    if (chartState.state === "ok" && chartState.chart.cid) {
      while (true) {
        // false positive TS7022: 'm' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
        const m: string | null = window.prompt(
          t("meta.confirmDelete", { cid: chartState.chart.cid })
        );
        if (m === null) {
          return;
        }
        if (m === chartState.chart.cid) {
          break;
        }
      }

      await fetchBackend()
        .url(`/api/chartFile/${chartState.chart.cid}`)
        .options({
          cache: "no-store",
          credentials:
            process.env.NODE_ENV === "development" ? "include" : "same-origin",
        })
        .auth(chartAuthorization(chartState.chart.currentPasswd) ?? "")
        .middlewares([chartFileRetryMiddleware()])
        .delete()
        .unauthorized(() => undefined)
        .notFound(() => undefined)
        .error(429, () => undefined)
        .res(() => {
          if (isStandalone() || isInsideFrame()) {
            history.back();
          } else {
            window.close();
          }
        });
      // TODO: エラーの場合ユーザーにエラーメッセージを表示する?
    } else {
      throw new Error("chart is empty");
    }
  }, [chartState, t]);

  const [localSaveState, setLocalSaveState] = useState<SaveState>(undefined);
  const localSave = useCallback(
    (format: "lua") => {
      setLocalLoadState(undefined);
      if (chartState.state === "ok") {
        setLocalSaveState("saving");
        let blob: Blob;
        let extension: string;
        switch (format) {
          // case "yml":
          //   extension = `fn${currentChartVer}.yml`;
          //   blob = new Blob([
          //     YAML.stringify(chartState.chart.toMin(), { indentSeq: false }),
          //   ]);
          //   break;
          case "lua":
            extension = `fn.lua`;
            blob = new Blob([
              chartToLuaTableCode(
                chartState.chart.toObject(),
                fnCommandsPackageJson.version.split(".").slice(0, 2).join(".")
              ),
            ]);
            break;
          default:
            format satisfies never;
            throw new Error(`invalid format ${format}`);
        }
        const filename = `${chartState.chart.cid}_${chartState.chart.meta.title}.${extension}`;
        saveAs(blob, filename);
        setLocalSaveState("ok");
        return filename;
      } else {
        return "";
      }
    },
    [chartState]
  );
  const [localLoadState, setLocalLoadState] =
    useState<LocalLoadState>(undefined);
  const localLoad = useCallback(
    async (buffer: ArrayBuffer) => {
      setLocalLoadState("loading");
      setLocalSaveState(undefined);
      const validateAndExec = async (newChartMin: unknown) => {
        if (
          typeof newChartMin === "object" &&
          newChartMin &&
          "falling" in newChartMin &&
          newChartMin.falling === "nikochan" &&
          "ver" in newChartMin &&
          typeof newChartMin.ver === "number"
        ) {
          const originalVer = newChartMin.ver;
          try {
            newChartMin = await validateChartMin(
              newChartMin as ChartUntil14Min
            );
          } catch (e) {
            if (e instanceof v.ValiError) {
              console.error(e.issues);
              throw new LocalLoadError(
                e.issues.map((i) => i.message).join(", ")
              );
            } else {
              throw new LocalLoadError(String(e));
            }
          }
          return {
            originalVer,
            newChart: await convertToLatest({
              ...(newChartMin as Chart14Min),
              changePasswd: null,
              published: false,
              levelsFreeze: await Promise.all(
                (newChartMin as Chart14Min).lua.map(async (l) => {
                  const { levelFreezed } = await luaExec(
                    process.env.ASSET_PREFIX + "/wasmoon_glue.wasm",
                    fnCommandsLib,
                    l.join("\n"),
                    { catchError: false, needReturnValue: false }
                  );
                  const { bpm, speed } = updateBpmTimeSec(
                    levelFreezed.bpmChanges,
                    levelFreezed.speedChanges
                  );
                  const signature = updateBarNum(levelFreezed.signature);
                  return {
                    ...levelFreezed,
                    bpmChanges: bpm,
                    speedChanges: speed!,
                    signature,
                  };
                })
              ),
            } satisfies Chart14Edit),
          };
        } else {
          throw new Error("invalid chart format");
        }
      };
      let result: Awaited<ReturnType<typeof validateAndExec>> | null = null;
      try {
        result = await validateAndExec(
          YAML.parse(new TextDecoder().decode(buffer))
        );
      } catch (e1) {
        console.log("yaml deserialize failed:", e1);
        try {
          result = await validateAndExec(msgpack.decode(buffer));
        } catch (e2) {
          console.log("msgpack deserialize failed:", e2);
          try {
            const rawCode = new TextDecoder().decode(buffer);
            const luaResult = await luaExec(
              process.env.ASSET_PREFIX + "/wasmoon_glue.wasm",
              fnCommandsLib,
              rawCode,
              { catchError: true, needReturnValue: true, isChartFile: true }
            );
            if (luaResult.err.length > 0) {
              throw new LocalLoadError(luaResult.err.join(", "));
            }
            console.log("lua rawReturnValue:", luaResult.rawReturnValue);
            result = {
              originalVer: (luaResult.rawReturnValue as ChartEdit).ver,
              newChart: await validateChart({
                ...(luaResult.rawReturnValue as ChartEdit),
                lua: findLuaLevelCode(rawCode),
                locale,
              }),
            };
          } catch (e3: unknown) {
            console.log("lua execution failed:", e3);

            if (e3 instanceof v.ValiError) {
              console.error(e3.issues);
              // eslint-disable-next-line no-ex-assign
              e3 = new LocalLoadError(
                e3.issues.map((i) => i.message).join(", ")
              );
            }

            if (e1 instanceof LocalLoadError) {
              setLocalLoadState(e1);
            } else if (e2 instanceof LocalLoadError) {
              setLocalLoadState(e2);
            } else if (e3 instanceof LocalLoadError) {
              setLocalLoadState(e3);
            } else {
              setLocalLoadState(new LocalLoadError(""));
            }
            return;
          }
        }
      }

      if (confirm(t("meta.confirmLoad"))) {
        setChartState({
          chart: new ChartEditing(result.newChart, {
            luaExecutorRef,
            locale,
            cid: chartState.state === "ok" ? chartState.chart.cid : undefined,
            currentPasswd:
              chartState.state === "ok"
                ? chartState.chart.currentPasswd
                : undefined,
            convertedFrom: result.originalVer,
          }),
          state: "ok",
        });
        setLocalLoadState("ok");
        return;
      }
      return setLocalLoadState(undefined);
    },
    [chartState, locale, t]
  );

  useEffect(() => {
    if (chartState.state === undefined) {
      const params = new URLSearchParams(window.location.search);
      const cid = params.get("cid");
      if (sessionStorage.getItem("editSession")) {
        const data = JSON.parse(
          sessionStorage.getItem("editSession")!
        ) as EditSession;
        sessionStorage.removeItem("editSession");
        if (data.cid === cid || (data.cid === undefined && cid === "new")) {
          setChartState({
            chart: new ChartEditing(data.chart, {
              luaExecutorRef,
              cid: data.cid,
              currentPasswd: data.currentPasswd,
              convertedFrom: data.convertedFrom,
              currentLevelIndex: data.currentLevelIndex,
              hasChange: data.hasChange,
              locale,
            }),
            state: "ok",
          });
          setSavePasswd(data.savePasswd);
          // onLoadRef.current();
          return;
        }
      }

      const savePasswd = preferSavePasswd() || getPasswd(cid ?? "") !== null;
      setSavePasswd(savePasswd);

      if (cid === "new") {
        setChartState({
          chart: new ChartEditing(emptyChart(locale), {
            luaExecutorRef,
            locale,
            cid: undefined,
            currentPasswd: undefined,
          }),
          state: "ok",
        });
        onLoadRef.current("new");
      } else if (cid) {
        void fetchChart(cid, { isFirst: true, editPasswd: "", savePasswd });
      } else {
        router.push(`/${locale}/main/edit`);
      }
    }
  }, [fetchChart, t, locale, router, chartState, savePasswd]);

  // PWAでテストプレイを押した場合に編集中の譜面データをsessionStorageに退避
  const saveEditSession = useCallback(() => {
    if (chartState.state === "ok") {
      sessionStorage.setItem(
        "editSession",
        JSON.stringify({
          cid: chartState.chart.cid,
          currentPasswd: chartState.chart.currentPasswd,
          chart: chartState.chart.toObject(),
          convertedFrom: chartState.chart.convertedFrom,
          currentLevelIndex: chartState.chart.currentLevelIndex,
          hasChange: chartState.chart.hasChange,
          savePasswd: !!savePasswd,
        } satisfies EditSession)
      );
    }
  }, [chartState, savePasswd]);

  useEffect(() => {
    if (chartState.state === "ok") {
      const resetStates = () => {
        setSaveState(undefined);
        setLocalSaveState(undefined);
        setLocalLoadState(undefined);
      };
      chartState.chart.on("change", resetStates);
      return () => {
        chartState.chart.off("change", resetStates);
      };
    }
  }, [chartState]);

  return {
    chart: chartState.state === "ok" ? chartState.chart : undefined,
    loadStatus: chartState.state,
    fetchChart,
    saveEditSession,
    savePasswd,
    setSavePasswd,
    saveState,
    remoteSave,
    remoteDelete,
    localSaveState,
    localSave,
    localLoadState,
    localLoad,
  };
}
