"use client";

import AceEditor from "react-ace";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-min-noconflict/theme-github";
import "ace-builds/src-min-noconflict/theme-monokai";
import "ace-builds/src-min-noconflict/mode-lua";
import "ace-builds/src-min-noconflict/snippets/lua";
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
import { LevelFreeze, Result } from "@falling-nikochan/chart";
import { Step } from "@falling-nikochan/chart";
import { findStepFromLua } from "@falling-nikochan/chart";
import { useTheme } from "@/common/theme.js";
import { LevelEdit } from "@falling-nikochan/chart";
import { useResizeDetector } from "react-resize-detector";
import { useTranslations } from "next-intl";
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
        ({ data }: { data: Result }) => {
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
  changeLevel: (lua: string[]) => void;
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
      currentLevelCode !== undefined &&
      previousLevelCode.current !== currentLevelCode
    ) {
      previousLevelCode.current = currentLevelCode;
      setCode(currentLevelCode);
    }
  }, [currentLevel]);
  useEffect(() => {
    if (codeChanged) {
      const t = setTimeout(() => {
        setCodeChanged(false);
        changeLevel(code.split("\n"));
      }, 500);
      return () => clearTimeout(t);
    }
  }, [code, codeChanged, changeLevel]);

  return (
    <LuaPositionContext.Provider value={{ data, setData }}>
      {props.children}
      <div
        className={"absolute " + (visible ? "" : "hidden")}
        style={{ top, left, width, height }}
      >
        <AceEditor
          mode="lua"
          theme={themeState.isDark ? "monokai" : "github"}
          width="100%"
          height="100%"
          tabSize={2}
          fontSize={1 * rem}
          value={code}
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
              type: "fullLine",
              // なぜか座標はAce側で指定してくれるのにposition:absoluteが無い
              className: "absolute z-5 bg-red-200 dark:bg-red-900 ",
            },
          ]}
          enableBasicAutocompletion={true}
          enableLiveAutocompletion={true}
          enableSnippets={true}
          onChange={(value) => {
            if (visible) {
              setCode(value);
              setCodeChanged(true);
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

export function LuaTabPlaceholder(props: Props) {
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
    // window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("resize", onScroll);
      // window.removeEventListener("scroll", onScroll);
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
  ]);
  return <div ref={ref} className="absolute inset-3 -z-10 " />;
}
