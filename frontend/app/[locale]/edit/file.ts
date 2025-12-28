import {
  ChartEdit,
  ChartMin,
  convertToMin,
  currentChartVer,
  validateChartMin,
} from "@falling-nikochan/chart";
import saveAs from "file-saver";
import { RefObject, useCallback } from "react";
import YAML from "yaml";
import { useTranslations } from "next-intl";
import { luaExec } from "@falling-nikochan/chart/dist/luaExec";
import msgpack from "@ygoe/msgpack";
import { getPasswd, setPasswd, unsetPasswd } from "@/common/passwdCache.js";
import { addRecent } from "@/common/recent";
import { isStandalone, updatePlayCountForReview } from "@/common/pwaInstall";
import { ChartEditing } from "./chartState";

export interface FileSaveResult {
  isError: boolean;
  message?: string;
  cid?: string;
}
export interface FileLoadResult {
  isError: boolean;
  message?: string;
  chart?: ChartEdit;
  originalVer?: number;
}
export function useChartFile(chart: ChartEditing | undefined) {
  const t = useTranslations("edit.meta");
  const te = useTranslations("error");

  const errorFromResponse = useCallback(
    (res: Response) => {
      try {
        const message = (res as unknown as { message?: string }).message;
        if (te.has("api." + message)) {
          return te("api." + message);
        } else {
          return message || te("unknownApiError");
        }
      } catch {
        return te("unknownApiError");
      }
    },
    [te]
  );

  const remoteSave = useCallback<() => Promise<FileSaveResult>>(async () => {
    if (chart) {
      const onSave = async (cid: string) => {
        // 新規作成と上書きで共通の処理
        if (chart.changePasswd) {
          if (chart.savePasswd) {
            try {
              fetch(
                process.env.BACKEND_PREFIX +
                  `/api/hashPasswd/${cid}?p=${chart.changePasswd}`,
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
        chart.resetOnSave(cid);
      };
      if (chart.cid === undefined) {
        try {
          const res = await fetch(
            process.env.BACKEND_PREFIX + `/api/newChartFile`,
            {
              method: "POST",
              body: msgpack.serialize(chart.toObject()),
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
                addRecent("edit", resBody.cid);
                updatePlayCountForReview();
                onSave(resBody.cid);
                return {
                  isError: false,
                  cid: resBody.cid,
                  message: t("saveDone"),
                };
              }
            } catch {
              // pass through
            }
            return {
              isError: true,
              message: te("badResponse"),
            };
          } else {
            return {
              isError: true,
              message: errorFromResponse(res),
            };
          }
        } catch (e) {
          console.error(e);
          return {
            isError: true,
            message: te("api.fetchError"),
          };
        }
      } else {
        const q = new URLSearchParams();
        if (chart.currentPasswd) {
          q.set("p", chart.currentPasswd);
        } else if (getPasswd(chart.cid)) {
          q.set("ph", getPasswd(chart.cid)!);
        }
        try {
          const res = await fetch(
            process.env.BACKEND_PREFIX +
              `/api/chartFile/${chart.cid}?` +
              q.toString(),
            {
              method: "POST",
              body: msgpack.serialize(chart.toObject()),
              cache: "no-store",
              credentials:
                process.env.NODE_ENV === "development"
                  ? "include"
                  : "same-origin",
            }
          );
          if (res.ok) {
            onSave(chart.cid);
            return {
              isError: false,
              cid: chart.cid,
              message: t("saveDone"),
            };
          } else {
            return {
              isError: true,
              message: errorFromResponse(res),
            };
          }
        } catch (e) {
          console.error(e);
          return {
            isError: true,
            message: te("api.fetchError"),
          };
        }
      }
    } else {
      throw new Error("chart is empty");
    }
  }, [errorFromResponse, chart, t, te]);

  const remoteDelete = useCallback<() => Promise<void>>(async () => {
    if(chart){
    const q = new URLSearchParams();
    if (chart.currentPasswd) {
      q.set("p", chart.currentPasswd);
    } else if (getPasswd(chart.cid!)) {
      q.set("ph", getPasswd(chart.cid!)!);
    }
    try {
      const res = await fetch(
        process.env.BACKEND_PREFIX +
          `/api/chartFile/${chart.cid}?` +
          q.toString(),
        {
          method: "DELETE",
          cache: "no-store",
          credentials:
            process.env.NODE_ENV === "development" ? "include" : "same-origin",
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
  }else{
    throw new Error("chart is empty")
  }
  }, [chart]);

  const downloadExtension = `fn${currentChartVer}.yml`;
  const localSave = useCallback<() => FileSaveResult>(() => {
    if (chart) {
      const yml = YAML.stringify(convertToMin(chart.toObject()), {
        indentSeq: false,
      });
      const filename = `${chart.cid}_${chart.meta.title}.${downloadExtension}`;
      saveAs(new Blob([yml]), filename);
      return {
        isError: false,
        message: `${t("saveDone")} (${filename})`,
      };
    } else {
      return {
        isError: true,
      };
    }
  }, [downloadExtension, chart, t]);
  const load = useCallback<(buffer: ArrayBuffer) => Promise<FileLoadResult>>(
    async (buffer: ArrayBuffer) => {
      let originalVer: number = 0;
      let newChart: ChartEdit | null = null;
      try {
        const content: ChartMin = YAML.parse(new TextDecoder().decode(buffer));
        if (typeof content.ver === "number") {
          originalVer = content.ver;
        }
        const newChartMin = await validateChartMin(content);
        newChart = {
          ...newChartMin,
          changePasswd: null,
          published: false,
          levels: await Promise.all(
            newChartMin.levels.map(async (l) => ({
              ...l,
              ...(
                await luaExec(
                  process.env.ASSET_PREFIX + "/assets/wasmoon_glue.wasm",
                  l.lua.join("\n"),
                  false
                )
              ).levelFreezed,
            }))
          ),
        };
      } catch (e1) {
        console.warn("fallback to msgpack deserialize");
        try {
          const content: ChartMin = msgpack.deserialize(buffer);
          if (typeof content.ver === "number") {
            originalVer = content.ver;
          }
          const newChartMin = await validateChartMin(content);
          newChart = {
            ...newChartMin,
            changePasswd: null,
            published: false,
            levels: await Promise.all(
              newChartMin.levels.map(async (l) => ({
                ...l,
                ...(
                  await luaExec(
                    process.env.ASSET_PREFIX + "/assets/wasmoon_glue.wasm",
                    l.lua.join("\n"),
                    false
                  )
                ).levelFreezed,
              }))
            ),
          };
        } catch (e2) {
          console.error(e1);
          console.error(e2);
          return {
            isError: true,
            message: t("loadFail"),
          };
        }
      }
      if (newChart) {
        if (confirm(t("confirmLoad"))) {
          return {
            isError: false,
            chart: newChart,
            originalVer,
          };
        }
      }
      return {
        isError: true,
        message: "",
      };
    },
    [t]
  );

  return {
    remoteSave,
    remoteDelete,
    localSave,
    load,
    downloadExtension,
  };
}
