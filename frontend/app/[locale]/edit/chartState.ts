import {
  getPasswd,
  preferSavePasswd,
  setPasswd,
  unsetPasswd,
} from "@/common/passwdCache";
import {
  ChartEdit,
  currentChartVer,
  emptyChart,
  validateChart,
  validateChartMin,
  ChartEditing,
  LuaExecutor,
  ChartUntil14,
  ChartUntil14Min,
  Chart14Min,
  LuaTableSchema,
  chartToLuaTableCode,
  findLuaLevelCode,
} from "@falling-nikochan/chart";
import { useCallback, useEffect, useRef, useState } from "react";
import * as msgpack from "@msgpack/msgpack";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { APIError } from "@/common/apiError";
import saveAs from "file-saver";
import YAML from "yaml";
import { luaExec } from "@falling-nikochan/chart/dist/luaExec";
import { isStandalone } from "@/common/pwaInstall";
import * as v from "valibot";
import fnCommandsLib from "fn-commands?raw";

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
        | APIError;
    };
export type LoadState = ChartAndState["state"];
export type LocalLoadState = undefined | "loading" | "ok" | "loadFail";
export type SaveState = undefined | "saving" | "ok" | APIError;
interface EditSession {
  cid: string | undefined;
  currentPasswd: string | null;
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

      const q = new URLSearchParams();
      if (getPasswd(cid)) {
        q.set("ph", getPasswd(cid)!);
      }
      if (options.editPasswd) {
        q.set("p", options.editPasswd);
      }
      if (options.bypass) {
        q.set("pbypass", "1");
      }
      let res: Response | null = null;
      try {
        res = await fetch(
          process.env.BACKEND_PREFIX + `/api/chartFile/${cid}?` + q.toString(),
          {
            cache: "no-store",
            credentials:
              process.env.NODE_ENV === "development"
                ? "include"
                : "same-origin",
          }
        );
        if (res.ok) {
          try {
            const chartRes = msgpack.decode(
              await res.arrayBuffer()
            ) as ChartUntil14;
            if (options.savePasswd) {
              if (options.editPasswd) {
                try {
                  const res = await fetch(
                    process.env.BACKEND_PREFIX +
                      `/api/hashPasswd/${cid}?p=${options.editPasswd}`,
                    {
                      credentials:
                        process.env.NODE_ENV === "development"
                          ? "include"
                          : "same-origin",
                    }
                  );
                  setPasswd(cid, await res.text());
                } catch {
                  //ignore
                }
              }
            } else {
              unsetPasswd(cid);
            }
            setChartState({
              chart: new ChartEditing(await validateChart(chartRes), {
                luaExecutorRef,
                locale,
                cid,
                currentPasswd: options.editPasswd || null,
                convertedFrom: chartRes.ver,
              }),
              state: "ok",
            });
            onLoadRef.current(cid);
          } catch (e) {
            console.error(e);
            setChartState({ state: APIError.badResponse() });
          }
        } else {
          if (res.status === 401) {
            if (options.isFirst) {
              setChartState({ state: "passwdFailedSilent" });
            } else {
              setChartState({ state: "passwdFailed" });
            }
          } else if (res?.status === 429) {
            setChartState({ state: "rateLimited" });
          } else {
            setChartState({ state: await APIError.fromRes(res) });
          }
        }
      } catch (e) {
        console.error(e);
        setChartState({ state: APIError.fetchError() });
      }
    },
    [locale]
  );

  const [saveState, setSaveState] = useState<SaveState>(undefined);
  const remoteSave = useCallback<() => Promise<void>>(async () => {
    if (chartState.state === "ok") {
      const onSave = async (cid: string) => {
        if (chartState.chart.changePasswd) {
          if (savePasswd) {
            try {
              fetch(
                process.env.BACKEND_PREFIX +
                  `/api/hashPasswd/${cid}?p=${chartState.chart.changePasswd}`,
                {
                  credentials:
                    process.env.NODE_ENV === "development"
                      ? "include"
                      : "same-origin",
                }
              ).then(async (res) => {
                setPasswd(cid, await res.text());
              });
            } catch {
              //ignore
            }
          } else {
            unsetPasswd(cid);
          }
        }
        chartState.chart.resetOnSave(cid);
      };

      setSaveState("saving");
      if (chartState.chart.cid === undefined) {
        try {
          const res = await fetch(
            process.env.BACKEND_PREFIX + `/api/newChartFile`,
            {
              method: "POST",
              body: msgpack.encode(chartState.chart.toObject()),
              cache: "no-store",
              credentials:
                process.env.NODE_ENV === "development"
                  ? "include"
                  : "same-origin",
            }
          );
          if (res.ok) {
            try {
              const resBody = (await res.json()) as {
                message?: string;
                cid?: string;
              };
              if (typeof resBody.cid === "string") {
                onLoadRef.current(resBody.cid);
                onSave(resBody.cid);
                setSaveState("ok");
                return;
              }
            } catch {
              // pass through
            }
            setSaveState(APIError.badResponse());
            return;
          } else {
            setSaveState(await APIError.fromRes(res));
            return;
          }
        } catch (e) {
          console.error(e);
          setSaveState(APIError.fetchError());
          return;
        }
      } else {
        const q = new URLSearchParams();
        if (chartState.chart.currentPasswd) {
          q.set("p", chartState.chart.currentPasswd);
        } else if (getPasswd(chartState.chart.cid)) {
          q.set("ph", getPasswd(chartState.chart.cid)!);
        }
        try {
          const res = await fetch(
            process.env.BACKEND_PREFIX +
              `/api/chartFile/${chartState.chart.cid}?` +
              q.toString(),
            {
              method: "POST",
              body: msgpack.encode(chartState.chart.toObject()),
              cache: "no-store",
              credentials:
                process.env.NODE_ENV === "development"
                  ? "include"
                  : "same-origin",
            }
          );
          if (res.ok) {
            onSave(chartState.chart.cid);
            setSaveState("ok");
            return;
          } else {
            setSaveState(await APIError.fromRes(res));
            return;
          }
        } catch (e) {
          console.error(e);
          setSaveState(APIError.fetchError());
          return;
        }
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
          t("confirmDelete", { cid: chartState.chart.cid })
        );
        if (m === null) {
          return;
        }
        if (m === chartState.chart.cid) {
          break;
        }
      }
      const q = new URLSearchParams();
      if (chartState.chart.currentPasswd) {
        q.set("p", chartState.chart.currentPasswd);
      } else if (getPasswd(chartState.chart.cid)) {
        q.set("ph", getPasswd(chartState.chart.cid)!);
      }
      try {
        const res = await fetch(
          process.env.BACKEND_PREFIX +
            `/api/chartFile/${chartState.chart.cid}?` +
            q.toString(),
          {
            method: "DELETE",
            cache: "no-store",
            credentials:
              process.env.NODE_ENV === "development"
                ? "include"
                : "same-origin",
          }
        );
        if (res.ok) {
          if (isStandalone()) {
            history.back();
          } else {
            window.close();
          }
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      throw new Error("chart is empty");
    }
  }, [chartState, t]);

  const [localSaveState, setLocalSaveState] = useState<SaveState>(undefined);
  const localSave = useCallback(
    (format: "yml" | "lua") => {
      if (chartState.state === "ok") {
        setLocalSaveState("saving");
        let blob: Blob;
        switch (format) {
          case "yml":
            blob = new Blob([
              YAML.stringify(chartState.chart.toMin(), { indentSeq: false }),
            ]);
            break;
          case "lua":
            blob = new Blob([chartToLuaTableCode(chartState.chart.toMin())]);
            break;
          default:
            format satisfies never;
            throw new Error(`invalid format ${format}`);
        }
        const filename = `${chartState.chart.cid}_${chartState.chart.meta.title}.fn${currentChartVer}.${format}`;
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
      const validateAndExec = async (newChartMin: unknown) => {
        let originalVer: number = 0;
        if (
          typeof newChartMin === "object" &&
          newChartMin &&
          "ver" in newChartMin &&
          typeof newChartMin.ver === "number"
        ) {
          originalVer = newChartMin.ver;
        }
        newChartMin = await validateChartMin(newChartMin as ChartUntil14Min);
        for (const lua of (newChartMin as Chart14Min).lua) {
          if (lua.every((line) => !line.includes("fn-commands"))) {
            lua.unshift('require("fn-commands")');
          }
        }
        return {
          originalVer,
          newChart: {
            ...(newChartMin as Chart14Min),
            changePasswd: null,
            published: false,
            levelsFreeze: await Promise.all(
              (newChartMin as Chart14Min).lua.map(
                async (l) =>
                  (
                    await luaExec(
                      process.env.ASSET_PREFIX + "/wasmoon_glue.wasm",
                      fnCommandsLib,
                      l.join("\n"),
                      { catchError: false, needReturnValue: false }
                    )
                  ).levelFreezed
              )
            ),
          } satisfies ChartEdit,
        };
      };
      let result: Awaited<ReturnType<typeof validateAndExec>> | null = null;
      try {
        result = await validateAndExec(
          YAML.parse(new TextDecoder().decode(buffer))
        );
      } catch (e1) {
        console.warn("fallback to msgpack deserialize");
        try {
          result = await validateAndExec(msgpack.decode(buffer));
        } catch (e2) {
          console.warn("fallback to lua execution");
          try {
            const rawCode = new TextDecoder().decode(buffer);
            const luaResult = await luaExec(
              process.env.ASSET_PREFIX + "/wasmoon_glue.wasm",
              fnCommandsLib,
              rawCode,
              { catchError: false, needReturnValue: true }
            );
            console.log("lua rawReturnValue:", luaResult.rawReturnValue);
            const luaTable = v.parse(
              LuaTableSchema(),
              luaResult.rawReturnValue
            );
            result = await validateAndExec({
              ...luaTable,
              ver: luaTable.ver as 14,
              locale,
              lua: findLuaLevelCode(rawCode),
              levelsMin: luaTable.levels,
            } satisfies Chart14Min);
          } catch (e3) {
            console.error(e1);
            console.error(e2);
            console.error(e3);
          }
        }
      }
      if (!result) {
        setLocalLoadState("loadFail");
        return;
      }

      if (confirm(t("meta.confirmLoad"))) {
        setChartState({
          chart: new ChartEditing(result.newChart, {
            luaExecutorRef,
            locale,
            cid: chartState.state === "ok" ? chartState.chart.cid : undefined,
            currentPasswd:
              chartState.state === "ok" ? chartState.chart.currentPasswd : null,
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

      const savePasswd = preferSavePasswd();
      setSavePasswd(savePasswd);

      if (cid === "new") {
        setChartState({
          chart: new ChartEditing(emptyChart(locale), {
            luaExecutorRef,
            locale,
            cid: undefined,
            currentPasswd: null,
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
