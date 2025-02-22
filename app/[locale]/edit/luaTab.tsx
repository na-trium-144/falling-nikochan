"use client";

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/mode-lua";
import "ace-builds/src-noconflict/snippets/lua";
import { useEffect, useState } from "react";
import { useDisplayMode } from "@/scale.js";
import { luaExec } from "@/../../chartFormat/lua/exec.js";
import { Step } from "@/../../chartFormat/step.js";
import { findStepFromLua } from "@/../../chartFormat/lua/edit.js";
import { ThemeContext } from "@/common/theme.js";
import { LevelEdit } from "../../../chartFormat/chart.js";

export function useLuaExecutor() {
  const [stdout, setStdout] = useState<string[]>([]);
  const [err, setErr] = useState<string[]>([]);
  const [errLine, setErrLine] = useState<number | null>(null);
  const [running, setRunning] = useState<boolean>(false);

  const exec = async (code: string) => {
    setRunning(true);
    const result = await luaExec(code, true);
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
  currentLevel: LevelEdit | undefined;
  changeLevel: (lua: string[]) => void;
  seekStepAbs: (s: Step) => void;
  themeContext: ThemeContext;
}
export default function LuaTab(props: Props) {
  const { currentLevel, changeLevel, seekStepAbs } = props;
  const { rem } = useDisplayMode();
  const [code, setCode] = useState<string>(currentLevel?.lua.join("\n") || "");
  const [codeChanged, setCodeChanged] = useState<boolean>(false);

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
    <div className="flex flex-col absolute inset-3 space-y-3">
      <div className="flex-1 w-full">
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
    </div>
  );
}
