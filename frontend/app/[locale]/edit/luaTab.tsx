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
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDisplayMode } from "@/scale.js";
import { luaExec } from "@falling-nikochan/chart";
import { Step } from "@falling-nikochan/chart";
import { findStepFromLua } from "@falling-nikochan/chart";
import { ThemeContext } from "@/common/theme.js";
import { LevelEdit } from "@falling-nikochan/chart";
import { useResizeDetector } from "react-resize-detector";
import { useTranslations } from "next-intl";

export function useLuaExecutor() {
  const [stdout, setStdout] = useState<string[]>([]);
  const [err, setErr] = useState<string[]>([]);
  const [errLine, setErrLine] = useState<number | null>(null);
  const [running, setRunning] = useState<boolean>(false);

  const exec = async (code: string) => {
    setRunning(true);
    const result = await luaExec(
      process.env.ASSET_PREFIX + "/assets/wasmoon_glue.wasm",
      code,
      true,
    );
    setRunning(false);
    setStdout(result.stdout);
    setErr(result.err);
    setErrLine(result.errorLine);
    if (result.err.length === 0) {
      return result.levelFreezed;
    } else {
      return null;
    }
  };
  return { stdout, err, errLine, running, exec };
}

// Aceはposition:fixedがviewportに対する絶対座標であることを想定しているが
// ここで他のタブと同様にEditorを配置するとfixedが親divからの相対座標になってしまいうまく動作しない
// ので、Editorを表示するdivを絶対座標で別に配置ししている
interface Props {
  visible: boolean;
  currentLevel: LevelEdit | undefined;
  currentStepStr: string | null;
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
  themeContext: ThemeContext;
}
export function LuaTabProvider(props: PProps) {
  const [data, setData] = useState<LuaPositionData>({
    visible: false,
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    currentLine: null,
    currentStepStr: "",
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
          theme={props.themeContext.isDark ? "monokai" : "github"}
          width="100%"
          height="100%"
          tabSize={2}
          fontSize={1 * rem}
          value={code}
          annotations={[
            {
              row: currentLine === null ? -1 : currentLine,
              column: 1,
              text: t("currentLine", { step: currentStepStr || "null" }),
              type: "info",
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
            setCode(value);
            setCodeChanged(true);
          }}
          onCursorChange={(sel) => {
            if (currentLevel) {
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
