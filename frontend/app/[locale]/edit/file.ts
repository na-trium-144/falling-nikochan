import {
  ChartEdit,
  ChartMin,
  convertToMin,
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
interface Props {
  cid: string | undefined;
  chart: ChartEdit | undefined;
  savePasswd: boolean;
  currentPasswd: RefObject<string | null>;
  locale: string;
}
export function useChartFile(props: Props) {
  const t = useTranslations("edit.meta");
  const te = useTranslations("error");

  const errorFromResponse = useCallback(
    async (res: Response) => {
      try {
        const message = (await res.json()).message;
        if (te.has("api." + message)) {
          console.log(
            "errorFromResponse:",
            message,
            "=>",
            te("api." + message)
          );
          return String(res.status) + ": " + te("api." + message);
        } else {
          console.log("errorFromResponse:", message, "(message not found)");
          return String(res.status) + ": " + (message || te("unknownApiError"));
        }
      } catch {
        console.log("errorFromResponse: (unknown message)");
        return String(res.status) + ": " + te("unknownApiError");
      }
    },
    [te]
  );

  const remoteSave = useCallback<() => Promise<FileSaveResult>>(async () => {
    const onSave = async (cid: string, changePasswd: string | null) => {
      if (changePasswd) {
        if (props.savePasswd) {
          try {
            fetch(
              process.env.BACKEND_PREFIX +
                `/api/hashPasswd/${cid}?p=${changePasswd}`,
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
    };
    if (props.cid === undefined) {
      try {
        const res = await fetch(
          process.env.BACKEND_PREFIX + `/api/newChartFile`,
          {
            method: "POST",
            body: msgpack.serialize(props.chart),
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
              onSave(resBody.cid, props.chart!.changePasswd);
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
            message: await errorFromResponse(res),
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
      if (props.currentPasswd.current) {
        q.set("p", props.currentPasswd.current);
      } else if (getPasswd(props.cid)) {
        q.set("ph", getPasswd(props.cid)!);
      }
      try {
        const res = await fetch(
          process.env.BACKEND_PREFIX +
            `/api/chartFile/${props.cid}?` +
            q.toString(),
          {
            method: "POST",
            body: msgpack.serialize(props.chart),
            cache: "no-store",
            credentials:
              process.env.NODE_ENV === "development"
                ? "include"
                : "same-origin",
          }
        );
        if (res.ok) {
          onSave(props.cid, props.chart!.changePasswd);
          return {
            isError: false,
            cid: props.cid,
            message: t("saveDone"),
          };
        } else {
          return {
            isError: true,
            message: await errorFromResponse(res),
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
  }, [
    errorFromResponse,
    props.chart,
    props.cid,
    props.currentPasswd,
    props.savePasswd,
    t,
    te,
  ]);
  const remoteDelete = useCallback<() => Promise<void>>(async () => {
    const q = new URLSearchParams();
    if (props.currentPasswd.current) {
      q.set("p", props.currentPasswd.current);
    } else if (getPasswd(props.cid!)) {
      q.set("ph", getPasswd(props.cid!)!);
    }
    try {
      const res = await fetch(
        process.env.BACKEND_PREFIX +
          `/api/chartFile/${props.cid}?` +
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
  }, [props.cid, props.currentPasswd]);

  const downloadExtension = `fn${props.chart?.ver}.yml`;
  const localSave = useCallback<() => FileSaveResult>(() => {
    if (props.chart) {
      const yml = YAML.stringify(convertToMin(props.chart), {
        indentSeq: false,
      });
      const filename = `${props.cid}_${props.chart.title}.${downloadExtension}`;
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
  }, [downloadExtension, props.chart, props.cid, t]);
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
                  process.env.ASSET_PREFIX + "/wasmoon_glue.wasm",
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
                    process.env.ASSET_PREFIX + "/wasmoon_glue.wasm",
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
