"use client";

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/mode-lua";
import { useState } from "react";
import { useDisplayMode } from "@/scale";
import { Chart } from "@/chartFormat/chart";
import Button from "@/common/button";
import { luaExec } from "@/chartFormat/lua/exec";

interface Props {
  chart?: Chart;
  changeChart: (chart: Chart) => void;
}
export default function LuaTab(props: Props) {
  const { rem } = useDisplayMode();
  const [code, setCode] = useState<string>(props.chart?.lua.join("\n") || "");
  const [stdout, setStdout] = useState<string[]>([]);
  const [err, setErr] = useState<string[]>([]);

  return (
    <div className="flex flex-col absolute inset-3 space-y-3">
      <div className="flex-1 w-full">
        <AceEditor
          mode="lua"
          theme="github"
          width="100%"
          height="100%"
          tabSize={2}
          fontSize={1 * rem}
          value={code}
          onChange={(value, e) => {
            setCode(value);
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
      <p>
        <Button
          text="Run"
          onClick={async () => {
            const result = await luaExec(code);
            setStdout(result.stdout);
            setErr(result.err);
            if (props.chart && result.err.length === 0) {
              props.changeChart({
                ...props.chart,
                lua: code.split("\n"),
                notes: result.notes,
                rest: result.rest,
                bpmChanges: result.bpmChanges,
              });
            }
          }}
        />
      </p>
    </div>
  );
}
