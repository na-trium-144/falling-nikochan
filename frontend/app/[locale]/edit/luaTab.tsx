"use client";

import clsx from "clsx/lite";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDisplayMode } from "@/scale.js";
import { LuaExecResult } from "@falling-nikochan/chart/dist/luaExec";
import { LevelFreeze } from "@falling-nikochan/chart";
import { Step } from "@falling-nikochan/chart";
import { findStepFromLua } from "@falling-nikochan/chart";
import { useTheme } from "@/common/theme.js";
import { LevelEdit } from "@falling-nikochan/chart";
import { useResizeDetector } from "react-resize-detector";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
const AceEditor = dynamic(
  async () => {
    const ace = await import("react-ace");
    await import("ace-builds/src-min-noconflict/ext-language_tools");
    await import("ace-builds/src-min-noconflict/theme-tomorrow");
    await import("ace-builds/src-min-noconflict/theme-tomorrow_night");
    await import("ace-builds/src-min-noconflict/mode-lua");
    await import("ace-builds/src-min-noconflict/snippets/lua");
    await import("ace-builds/src-min-noconflict/ext-searchbox");
    return ace;
  },
  { ssr: false }
);
// https://github.com/vercel/next.js/discussions/29415
import "remote-web-worker";

export function useLuaExecutor() {
  const [stdout, setStdout] = useState<string[]>([]);
  const [err, setErr] = useState<string[]>([]);
  const [errLine, setErrLine] = useState<number | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const worker = useRef<Worker | null>(null);
  const workerResolver = useRef<((result: LevelFreeze | null) => void) | null>(
    null
  );

  const abortExec = useCallback(() => {
    if (worker.current !== null) {
      worker.current.terminate();
      worker.current = null;
    }
    if (workerResolver.current !== null) {
      setRunning(false);
      setStdout([]);
      setErr(["terminated"]);
      setErrLine(-1);
      workerResolver.current(null);
      workerResolver.current = null;
    }
  }, []);
  const exec = useCallback(
    (code: string) => {
      if (worker.current !== null) {
        abortExec();
      }
      setRunning(true);
      const p = new Promise<LevelFreeze | null>((resolve) => {
        workerResolver.current = resolve;
      });
      worker.current = new Worker(new URL("luaExecWorker", import.meta.url));
      worker.current.postMessage({ code, catchError: true });
      worker.current.addEventListener(
        "message",
        ({ data }: { data: LuaExecResult }) => {
          if (workerResolver.current) {
            setRunning(false);
            setStdout(data.stdout);
            setErr(data.err);
            setErrLine(data.errorLine);
            if (data.err.length === 0) {
              workerResolver.current(data.levelFreezed);
            } else {
              workerResolver.current(null);
            }
            workerResolver.current = null;
          } else {
            console.error("luaExecWorker finished but resolver is null");
          }
        }
      );
      return p;
    },
    [abortExec]
  );
  return { stdout, err, errLine, running, exec, abortExec };
}

// Aceはposition:fixedがviewportに対する絶対座標であることを想定しているが
// ここで他のタブと同様にEditorを配置するとfixedが親divからの相対座標になってしまいうまく動作しない
// ので、Editorを表示するdivを絶対座標で別に配置ししている
interface Props {
  visible: boolean;
  currentLevel: LevelEdit | undefined;
  currentStepStr: string | null;
  barLines: { barNum: number; luaLine: number }[];
  changeLevel: (level: { lua: string[] }) => void;
  currentLine: number | null;
  seekStepAbs: (s: Step) => void;
  errLine: number | null;
  err: string[];
}
interface LuaPositionData extends Props {
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

interface PProps {
  children: ReactNode;
}
export function LuaTabProvider(props: PProps) {
  const themeState = useTheme();
  const [data, setData] = useState<LuaPositionData>({
    visible: false,
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    currentLine: null,
    currentStepStr: "",
    barLines: [],
    currentLevel: undefined,
    changeLevel: () => {},
    seekStepAbs: () => {},
    errLine: null,
    err: [],
  });

  const {
    top,
    left,
    width,
    height,
    visible,
    currentLine,
    currentStepStr,
    barLines,
    currentLevel,
    changeLevel,
    seekStepAbs,
    errLine,
    err,
  } = data;
  const { rem } = useDisplayMode();
  const t = useTranslations("edit.code");
  const previousLevelCode = useRef<string>("");
  const [code, setCode] = useState<string>("");
  const [codeChanged, setCodeChanged] = useState<boolean>(false);

  useEffect(() => {
    const currentLevelCode = currentLevel?.lua.join("\n");
    if (
      !codeChanged &&
      currentLevelCode !== undefined &&
      previousLevelCode.current !== currentLevelCode
    ) {
      previousLevelCode.current = currentLevelCode;
      setCode(currentLevelCode);
    }
  }, [codeChanged, currentLevel]);

  const changeCodeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changeCode = (code: string) => {
    setCode(code);
    setCodeChanged(true);
    if (changeCodeTimeout.current !== null) {
      clearTimeout(changeCodeTimeout.current);
    }
    changeCodeTimeout.current = setTimeout(() => {
      changeCodeTimeout.current = null;
      setCodeChanged(false);
      changeLevel({ lua: code.split("\n") });
    }, 500);
  };

  return (
    <LuaPositionContext.Provider value={{ data, setData }}>
      {props.children}
      <div
        className={clsx("absolute rounded-box", visible || "hidden")}
        style={{ top, left, width, height }}
      >
        <AceEditor
          mode="lua"
          theme={themeState.isDark ? "tomorrow_night" : "tomorrow"}
          width="100%"
          height="100%"
          tabSize={2}
          fontSize={1 * rem}
          highlightActiveLine={false}
          value={code}
          setOptions={{ useWorker: false }}
          annotations={[
            ...barLines.map((bl) => ({
              row: bl.luaLine,
              column: 1,
              text: `${bl.barNum};`,
              type: "info",
            })),
            {
              row: currentLine === null ? -1 : currentLine,
              column: 1,
              text: t("currentLine", { step: currentStepStr || "null" }),
              type: "warning",
            },
            {
              row: errLine === null ? -1 : errLine,
              column: 1,
              text: err[0],
              type: "error",
            },
          ]}
          markers={[
            {
              startRow: errLine === null ? -1 : errLine,
              endRow: errLine === null ? -1 : errLine,
              startCol: 0,
              endCol: 1,
              type: "fullLine" as const,
              className: "absolute z-5 bg-red-200 dark:bg-red-900 ",
            },
            ...barLines.map((bl) => ({
              startRow: bl.luaLine,
              endRow: bl.luaLine,
              startCol: 0,
              endCol: 1,
              type: "fullLine" as const,
              className: clsx(
                "absolute h-[1px]! bg-gray-500",
                "shadow-[0_0_2px] shadow-gray-500/75"
              ),
            })),
            {
              startRow: currentLine === null ? -1 : currentLine,
              endRow: currentLine === null ? -1 : currentLine,
              startCol: 0,
              endCol: 1,
              type: "fullLine" as const,
              className: clsx(
                "absolute h-0!",
                "shadow-[0_0.7em_0.5em_0.2em] shadow-yellow-400/50"
              ),
            },
          ]}
          enableBasicAutocompletion={true}
          enableLiveAutocompletion={true}
          enableSnippets={true}
          onChange={(value) => {
            if (visible) {
              changeCode(value);
            }
          }}
          onCursorChange={(sel) => {
            if (currentLevel && visible) {
              const step = findStepFromLua(currentLevel, sel.cursor.row);
              if (step !== null) {
                seekStepAbs(step);
              }
            }
          }}
        />
      </div>
    </LuaPositionContext.Provider>
  );
}

export function LuaTabPlaceholder(
  props: Props & { parentContainer: HTMLDivElement | null }
) {
  const { ref } = useResizeDetector();
  const {
    visible,
    currentLine,
    currentStepStr,
    barLines,
    currentLevel,
    changeLevel,
    seekStepAbs,
    errLine,
    err,
    parentContainer,
  } = props;
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
          visible,
          currentLine,
          currentStepStr,
          barLines,
          currentLevel,
          changeLevel,
          seekStepAbs,
          errLine,
          err,
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
  }, [
    visible,
    currentLine,
    currentStepStr,
    barLines,
    currentLevel,
    changeLevel,
    seekStepAbs,
    ref,
    setData,
    errLine,
    err,
    parentContainer,
  ]);
  return <div ref={ref} className="absolute inset-[1px] -z-10 " />;
}
