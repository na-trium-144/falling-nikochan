import { defaultCopyBuffer } from "./command.js";
import { ChartUntil14Min } from "./legacy/chart14.js";

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
  chart: ChartUntil14Min,
  fnCommandsVer: string
): string {
  const levelsLuaOnly = (
    "levelsMin" in chart
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
  const copyBuffer = (
    "copyBuffer" in chart ? chart.copyBuffer : defaultCopyBuffer()
  )
    .map((n, i) =>
      n
        ? `    [${i}] = {${n.hitX}, ${n.hitVX}, ${n.hitVY}, ${n.big}, ${n.fall}},`
        : `    [${i}] = nil,`
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
