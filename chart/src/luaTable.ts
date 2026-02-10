import { levelTypesConst } from "./chart.js";
import { defaultCopyBuffer } from "./command.js";
import { YTBeginSchema11, YTEndSchema11 } from "./legacy/chart11.js";
import { ChartUntil14Min } from "./legacy/chart14.js";
import * as v from "valibot";
import { stepZero } from "./step.js";
import { NoteCommand9 } from "./legacy/chart9.js";

export const CopyBufferEntrySchema = () =>
  v.tuple([
    v.number(), // x
    v.number(), // vx
    v.number(), // vy
    v.boolean(), // big
    v.boolean(), // fall
  ]);
export const LuaTableSchema = () =>
  v.object({
    falling: v.literal("nikochan"),
    ver: v.pipe(v.number(), v.integer(), v.minValue(14)),
    offset: v.pipe(v.number(), v.minValue(0)),
    ytId: v.string(),
    title: v.string(),
    composer: v.string(),
    chartCreator: v.string(),
    zoom: v.pipe(v.number(), v.integer()),
    copyBuffer: v.pipe(
      v.object(
        Object.fromEntries(
          Array.from(new Array(10), (_, i) => [
            String(i), // 0-9
            v.optional(CopyBufferEntrySchema()),
          ])
        )
      ),
      v.transform((copyBuffer) =>
        Array.from(new Array(10), (_, i) =>
          copyBuffer[String(i)]
            ? ({
                hitX: copyBuffer[String(i)]![0],
                hitVX: copyBuffer[String(i)]![1],
                hitVY: copyBuffer[String(i)]![2],
                big: copyBuffer[String(i)]![3],
                fall: copyBuffer[String(i)]![4],
                step: stepZero(),
                luaLine: null,
              } satisfies NoteCommand9)
            : null
        )
      )
    ),
    levels: v.array(
      v.object({
        name: v.string(),
        type: v.picklist(levelTypesConst),
        unlisted: v.boolean(),
        ytBegin: YTBeginSchema11(),
        ytEnd: YTEndSchema11(),
        ytEndSec: v.number(),
        snapDivider: v.number(),
        content: v.pipe(
          v.optional(v.any()),
          v.transform(() => undefined)
        ),
      })
    ),
  });
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
export function chartToLuaTableCode(chart: ChartUntil14Min): string {
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
    [
      "falling",
      "ver",
      "offset",
      "ytId",
      "title",
      "composer",
      "chartCreator",
      "zoom",
    ] as const
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
  return `return {
${jsonItems}
  levels = {
${levelsLuaOnly}
  },
  copyBuffer = {
${copyBuffer}
  },
}`;
  // locale, zoom, copyBufferを省略している
}
