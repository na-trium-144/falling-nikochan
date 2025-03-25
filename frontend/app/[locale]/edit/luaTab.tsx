"use client";

import AceEditor from "react-ace";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-min-noconflict/theme-github";
import "ace-builds/src-min-noconflict/theme-monokai";
import "ace-builds/src-min-noconflict/mode-lua";
import "ace-builds/src-min-noconflict/snippets/lua";
import { useEffect, useRef, useState } from "react";
import { useDisplayMode } from "@/scale.js";
import { luaExec } from "@falling-nikochan/chart";
import { Step } from "@falling-nikochan/chart";
import { findStepFromLua } from "@falling-nikochan/chart";
import { ThemeContext } from "@/common/theme.js";
import { LevelEdit } from "@falling-nikochan/chart";

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
      true
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

interface Props {
  visible: boolean;
  currentLevel: LevelEdit | undefined;
  changeLevel: (lua: string[]) => void;
  seekStepAbs: (s: Step) => void;
  themeContext: ThemeContext;
}
export default function LuaTab(props: Props) {
  const { currentLevel, changeLevel, seekStepAbs } = props;
  const { rem } = useDisplayMode();
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
    <div className={"absolute inset-3 " + (props.visible ? "" : "hidden! ")}>
      <AceEditor
        mode="lua"
        theme={props.themeContext.isDark ? "monokai" : "github"}
        width="100%"
        height="100%"
        tabSize={2}
        fontSize={1 * rem}
        value={code}
        annotations={
          /*指定すると表示位置がなんかおかしい
            errLine !== null
              ? [{ row: errLine, column: 1, text: err[0], type: "error" }]
              : []*/
          []
        }
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
  );
}
