"use client";

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/mode-lua";
import "ace-builds/src-noconflict/snippets/lua";
import { useEffect, useState } from "react";
import { useDisplayMode } from "@/scale.js";
import { Level } from "@/../chartFormat/chart.js";
import { luaExec } from "@/../chartFormat/lua/exec.js";
import { Step } from "@/../chartFormat/step.js";
import { findStepFromLua } from "@/../chartFormat/lua/edit.js";
import { ThemeContext } from "@/common/theme.js";

interface Props {
  currentLevel?: Level;
  changeLevel: (chart: Level) => void;
  seekStepAbs: (s: Step) => void;
  themeContext: ThemeContext;
}
export default function LuaTab(props: Props) {
  const { currentLevel, changeLevel, seekStepAbs } = props;
  const { rem } = useDisplayMode();
  const [code, setCode] = useState<string>(currentLevel?.lua.join("\n") || "");
  const [codeChanged, setCodeChanged] = useState<boolean>(false);
  const [stdout, setStdout] = useState<string[]>([]);
  const [err, setErr] = useState<string[]>([]);
  const [errLine, setErrLine] = useState<number | null>(null);

  useEffect(() => {
    if (codeChanged) {
      const t = setTimeout(() => {
        setCodeChanged(false);
        void (async () => {
          const result = await luaExec(code);
          setStdout(result.stdout);
          setErr(result.err);
          setErrLine(result.errorLine);
          if (currentLevel && result.err.length === 0) {
            changeLevel({
              ...currentLevel,
              lua: code.split("\n"),
              notes: result.notes,
              rest: result.rest,
              bpmChanges: result.bpmChanges,
              speedChanges: result.speedChanges,
              signature: result.signature,
            });
          }
        })();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [code, codeChanged, currentLevel, changeLevel]);

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
            errLine !== null
              ? [
                  /* 指定すると表示位置がなんかおかしい↓
                  { row: errLine, column: 1, text: err[0], type: "error" }
                  */
                ]
              : []
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
      {(stdout.length > 0 || err.length > 0) && (
        <div className="bg-slate-200 p-1 text-sm">
          {stdout.map((s, i) => (
            <p className="" key={i}>
              {s}
            </p>
          ))}
          {err.map((e, i) => (
            <p className="text-red-600" key={i}>
              {e}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
