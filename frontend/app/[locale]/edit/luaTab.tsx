"use client";

import clsx from "clsx/lite";
import {
  createContext,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDisplayMode } from "@/scale.js";
import { LuaExecResult } from "@falling-nikochan/chart/dist/luaExec";
import {
  ChartEditing,
  LevelEditing,
  LevelFreeze,
  LuaExecutor,
  LuaExecutorLastResult,
} from "@falling-nikochan/chart";
import { Step } from "@falling-nikochan/chart";
import { findStepFromLua } from "@falling-nikochan/chart";
import { useTheme } from "@/common/theme.js";
import { useResizeDetector } from "react-resize-detector";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
const AceEditor = dynamic(
  async () => {
    const ace = await import("react-ace");
    // await import("ace-builds/src-min-noconflict/ext-language_tools");
    await import("ace-builds/src-min-noconflict/theme-tomorrow");
    await import("ace-builds/src-min-noconflict/theme-tomorrow_night");
    await import("ace-builds/src-min-noconflict/mode-lua");
    // await import("ace-builds/src-min-noconflict/snippets/lua");
    await import("ace-builds/src-min-noconflict/ext-searchbox");
    return ace;
  },
  { ssr: false }
);
import type { Selection } from "ace-builds-internal/selection";
import type { WorkerInput } from "./luaExecWorker";
import type Ace from "ace-builds";

// https://github.com/vercel/next.js/discussions/29415
// import "remote-web-worker";
// nikochanでは同一originからも同じスクリプトにアクセス可能なので、
// 無理にクロスオリジンのスクリプトを読み込まず単にurlのoriginを書き換えるだけでok
if (typeof window !== "undefined") {
  const BaseWorker = window.Worker;
  window.Worker = class Worker extends BaseWorker {
    constructor(scriptURL: string | URL, options?: WorkerOptions) {
      super(
        new URL(new URL(scriptURL).pathname, window.location.origin),
        options
      );
    }
  };
}

export function useLuaExecutor(): LuaExecutor {
  // 1回目のworker起動時に出たエラーのみレンダリング時に再throwし、エラーページの表示にする
  const initDoneRef = useRef(false);
  const [initError, setInitError] = useState<Error>();

  // 表示用途のみのstate
  const [result, setResult] = useState<LuaExecutorLastResult | null>(null);
  const [running, setRunning] = useState<boolean>(false);

  const clearResult = useCallback(() => setResult(null), []);

  // workerは一度立てたら使いまわす。
  const worker = useRef<Worker | null>(null);
  // コードが実行中の場合、promiseに結果を返し上2つのstateを更新するコールバックを保持する。
  // 実行が完了したらresolverを呼び出した後これをnullにする。
  const workerResolver = useRef<
    | ((
        stdout: string[],
        err: string[],
        errLine: number | null,
        freeze: LevelFreeze | null
      ) => void)
    | null
  >(null);

  const initWorker = useCallback(() => {
    if (worker.current === null) {
      const thisWorker = new Worker(new URL("luaExecWorker", import.meta.url));
      worker.current = thisWorker;
      thisWorker.addEventListener("error", (e) => {
        console.error(e);
        if (!initDoneRef.current) {
          let err = e.error ?? e.message;
          if (!(err instanceof Error)) {
            err = new Error(String(err));
          }
          if (!(err as Error).stack) {
            (err as Error).stack = new Error().stack;
          }
          setInitError(err);
        }
        if (worker.current !== thisWorker) {
          // すでに別のworkerが動き始めているので、無視
          return;
        } else {
          workerResolver.current?.(
            [],
            // e.messageが空の場合がある
            [e.message || "Unknown error"],
            null,
            null
          );
          workerResolver.current = null;
        }
      });
      thisWorker.addEventListener(
        "message",
        ({ data }: { data: LuaExecResult | "initDone" }) => {
          if (typeof data === "string") {
            initDoneRef.current = true;
          } else {
            if (worker.current !== thisWorker) {
              // すでに別のworkerが動き始めているので、無視
              return;
            } else {
              workerResolver.current?.(
                data.stdout,
                data.err,
                data.errorLine,
                data.err.length === 0 ? data.levelFreezed : null
              );
              workerResolver.current = null;
            }
          }
        }
      );
    }
  }, []);
  useEffect(initWorker, [initWorker]);
  if (initError) {
    throw initError;
  }

  const abortExec = useCallback(() => {
    if (workerResolver.current !== null) {
      if (worker.current !== null) {
        worker.current.terminate();
        worker.current = null;
      }
      workerResolver.current?.([], ["terminated"], null, null);
      workerResolver.current = null;
    }
  }, []);
  const exec = useCallback(
    (code: string, levelIndex: number) => {
      abortExec();
      initWorker();
      setRunning(true);
      const p = new Promise<LevelFreeze | null>((resolve) => {
        workerResolver.current = (stdout, err, errLine, freeze) => {
          setRunning(false);
          setResult({ stdout, err, errLine, levelIndex });
          resolve(freeze);
        };
      });
      worker.current!.postMessage({ code } satisfies WorkerInput);
      return p;
    },
    [abortExec, initWorker]
  );

  return {
    result,
    running,
    exec,
    abortExec,
    clearResult,
  };
}

// Aceはposition:fixedがviewportに対する絶対座標であることを想定しているが
// ここで他のタブと同様にEditorを配置するとfixedが親divからの相対座標になってしまいうまく動作しない
// ので、Editorを表示するdivを絶対座標で別に配置ししている
interface Props {
  visible: boolean;
  chart?: ChartEditing;
  currentStepStr: string | null;
  seekStepAbs: (s: Step) => void;
  result: LuaExecutorLastResult | null;
  children: ReactNode;
  aceSessionRef: RefObject<(Ace.EditSession | null)[]>;
}
interface LuaPositionData {
  top: number;
  left: number;
  width: number;
  height: number;
}
interface LuaPositionContext {
  data: LuaPositionData;
  setData: (data: LuaPositionData) => void;
}
const LuaPositionContext = createContext<LuaPositionContext>(null!);

export function LuaTabProvider(props: Props) {
  const [data, setData] = useState<LuaPositionData>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  const { top, left, width, height } = data;
  const { visible, chart, currentStepStr, seekStepAbs, result, aceSessionRef } =
    props;

  return (
    <LuaPositionContext.Provider value={{ data, setData }}>
      {props.children}
      {chart?.levels.map((l, i) => (
        <div
          key={l.localId.toString()}
          className={clsx(
            "absolute rounded-sq-box isolate",
            (visible && i === chart?.currentLevelIndex) || "hidden"
          )}
          style={{ top, left, width, height }}
        >
          <AceEditorInstance
            level={l}
            currentStepStr={currentStepStr}
            seekStepAbs={seekStepAbs}
            result={result?.levelIndex === i ? result : null}
            setAceSession={(session) => {
              aceSessionRef.current[i] = session;
            }}
            visible={visible && chart.currentLevelIndex === i}
          />
        </div>
      ))}
    </LuaPositionContext.Provider>
  );
}

interface IProps {
  level: LevelEditing;
  currentStepStr: string | null;
  seekStepAbs: (s: Step) => void;
  result: LuaExecutorLastResult | null;
  setAceSession: (session: Ace.EditSession | null) => void;
  visible: boolean;
}
function AceEditorInstance(props: IProps) {
  const themeState = useTheme();
  const { level, currentStepStr, seekStepAbs, result, setAceSession, visible } =
    props;
  const cur = level.current;
  const { rem } = useDisplayMode();
  const t = useTranslations("edit.code");

  const editorRef = useRef<Ace.Editor | null>(null);
  useEffect(() => {
    setAceSession(editorRef.current?.session ?? null);
    return () => {
      setAceSession(null);
    };
  }, [setAceSession]);

  return (
    <AceEditor
      onLoad={(editor) => {
        editorRef.current = editor;
        // 無制限にするとsessionStorageにおさまらなくなってしまうため、適当に上限を設定している
        // @ts-expect-error accessing private property $undoDepth
        editor.session.getUndoManager().$undoDepth = 20;
        if (level.luaEditorInitialUndoManager) {
          editor.session
            .getUndoManager()
            .fromJSON(level.luaEditorInitialUndoManager);
        }
      }}
      mode="lua"
      theme={themeState.isDark ? "tomorrow_night" : "tomorrow"}
      width="100%"
      height="100%"
      tabSize={2}
      fontSize={1 * rem}
      highlightActiveLine={false}
      value={level.luaEditorValue}
      setOptions={{ useWorker: false }}
      annotations={[
        ...(level?.barLines.map((bl) => ({
          row: bl.luaLine,
          column: 1,
          text: `${bl.barNum};`,
          type: "info",
        })) || []),
        {
          row: cur?.line == null ? -1 : cur.line,
          column: 1,
          text: t("currentLine", { step: currentStepStr || "null" }),
          type: "warning",
        },
        {
          row: result?.errLine == null ? -1 : result.errLine,
          column: 1,
          text: result?.err[0] ?? "",
          type: "error",
        },
      ]}
      markers={[
        {
          startRow: result?.errLine == null ? -1 : result.errLine,
          endRow: result?.errLine == null ? -1 : result.errLine,
          startCol: 0,
          endCol: 1,
          type: "fullLine" as const,
          className: "absolute z-5 bg-red-200 dark:bg-red-900 ",
        },
        ...(level?.barLines.map((bl) => ({
          startRow: bl.luaLine,
          endRow: bl.luaLine,
          startCol: 0,
          endCol: 1,
          type: "fullLine" as const,
          className: clsx(
            "absolute h-[1px]! bg-gray-500",
            "shadow-[0_0_2px] shadow-gray-500/75"
          ),
        })) ?? []),
        {
          startRow: cur?.line == null ? -1 : cur?.line,
          endRow: cur?.line == null ? -1 : cur?.line,
          startCol: 0,
          endCol: 1,
          type: "fullLine" as const,
          className: clsx(
            "absolute h-0!",
            "shadow-[0_0.7em_0.5em_0.2em] shadow-yellow-400/50"
          ),
        },
      ]}
      enableBasicAutocompletion={false}
      enableLiveAutocompletion={false}
      enableSnippets={false}
      onChange={(value) => {
        level.setLuaEditorValue(value, visible);
      }}
      onCursorChange={(sel: Selection) => {
        if (visible && !sel.isMultiLine()) {
          const step = findStepFromLua(
            { ...level.freeze, lua: [...level.lua] },
            sel.cursor.row
          );
          if (step !== null) {
            seekStepAbs(step);
          }
        }
      }}
    />
  );
}

export function LuaTabPlaceholder(props: {
  parentContainer: HTMLDivElement | null;
}) {
  const { width, height, ref } = useResizeDetector();
  const { parentContainer } = props;
  const { setData } = useContext(LuaPositionContext);
  useEffect(() => {
    const onScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setData({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    };
    onScroll();
    window.addEventListener("resize", onScroll);
    parentContainer?.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("resize", onScroll);
      parentContainer?.removeEventListener("scroll", onScroll);
    };
  }, [width, height, ref, setData, parentContainer]);
  return (
    <div ref={ref} className="absolute inset-[1px] z-edit-ace-placeholder " />
  );
}
