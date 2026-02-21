import { defaultCopyBufferObj } from "./command.js";
import { ChartUntil15Min } from "./legacy/chart15.js";

export function findLuaLevelCode(rawCode: string) {
  return (
    rawCode.match(
      /LEVEL_CODE_BEGIN(?:(?!LEVEL_CODE_BEGIN)[\w\W])*?LEVEL_CODE_END/g
    ) ?? []
  ).map((code) => {
    let lines = code.split("\n").slice(1, -1);
    while (lines.every((line) => line.startsWith(" "))) {
      lines = lines.map((line) => line.slice(1));
    }
    return lines;
  });
}
export function chartToLuaTableCode(
  chart: ChartUntil15Min,
  fnCommandsVer: string
): string {
  const levelsLuaOnly = (
    "levelsMeta" in chart
      ? chart.levelsMeta
      : "levelsMin" in chart
        ? chart.levelsMin
        : "levels" in chart
          ? chart.levels
          : []
  )
    .map((min, i) => {
      const jsonItems = (
        [
          "name",
          "type",
          "unlisted",
          "ytBegin",
          "ytEndSec",
          "ytEnd",
          "snapDivider",
        ] as const
      )
        .map((key) =>
          key in min
            ? `      ${key} = ${JSON.stringify((min as any)[key])},`
            : null
        )
        .filter((line) => line)
        .join("\n");
      return `    {
${jsonItems}
      content = function() -- LEVEL_CODE_BEGIN --
        ${"lua" in chart && Array.isArray(chart.lua[i]) ? chart.lua[i].join("\n        ") : ""}
      end -- LEVEL_CODE_END --
    },`;
    })
    .join("\n");
  const jsonItems = (
    ["offset", "ytId", "title", "composer", "chartCreator", "zoom"] as const
  )
    .map((key) =>
      key in chart ? `  ${key} = ${JSON.stringify((chart as any)[key])},` : null
    )
    .filter((line) => line)
    .join("\n");
  const copyBuffer =
    "copyBuffer" in chart && Array.isArray(chart.copyBuffer)
      ? chart.copyBuffer
          .map((entry, i) =>
            entry
              ? `    [${i}] = {${entry.hitX}, ${entry.hitVX}, ${entry.hitVY}, ${entry.big}, ${entry.fall}},`
              : `    [${i}] = nil,`
          )
          .join("\n")
      : Object.entries(
          "copyBuffer" in chart ? chart.copyBuffer : defaultCopyBufferObj()
        )
          .map(([i, n]) =>
            n
              ? `    ["${i}"] = {${n[0]}, ${n[1]}, ${n[2]}, ${n[3]}, ${n[4]}},`
              : `    ["${i}"] = nil,`
          )
          .join("\n");
  return `require("fn-commands")
return fnChart({
  version = ${JSON.stringify(fnCommandsVer)},
${jsonItems}
  levels = {
${levelsLuaOnly}
  },
  copyBuffer = {
${copyBuffer}
  },
})
`;
}
