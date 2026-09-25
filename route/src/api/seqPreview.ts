import * as msgpack from "@msgpack/msgpack";
import { Bindings } from "../env.js";
import { Hono } from "hono";
import {
  ChartSeqData,
  loadChart,
  docRefs,
  currentChartVer,
  Chart17,
  ChartSchema17,
} from "@falling-nikochan/chart";
import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";
import {
  errorLiteral,
  sValidatorHook,
  validationErrorSchema,
} from "../error.js";
import { supportedEncodings } from "./decompress.js";

const seqPreviewApp = new Hono<{ Bindings: Bindings }>({ strict: false }).post(
  "/",
  describeRoute({
    description:
      "Accepts MessagePack-encoded Chart17 data and returns chart sequence data in MessagePack format for preview purposes.",
    requestBody: {
      description: "MessagePack-encoded Chart17 data",
      required: true,
      content: {
        "application/vnd.msgpack": {
          schema: docRefs("Chart17"),
        },
      },
    },
    parameters: [
      {
        name: "Content-Encoding",
        in: "header",
        description: "Encoding applied to the request body",
        schema: { type: "string" },
      },
    ],
    responses: {
      200: {
        description: "chart sequence data in MessagePack format for preview.",
        content: {
          "application/vnd.msgpack": {
            schema: docRefs("ChartSeqData"),
          },
        },
        headers: {
          "Content-Disposition": {
            description: "Filename with extension of .fnseq.mpk",
            schema: { type: "string" },
          },
        },
      },
      400: {
        description: "invalid query parameter",
        content: {
          "application/json": {
            schema: resolver(await validationErrorSchema()),
          },
        },
      },
      409: {
        description: `chart version is older than ${currentChartVer - 1}`,
        content: {
          "application/json": {
            schema: resolver(await errorLiteral("oldChartVersion")),
          },
        },
      },
      415: {
        description:
          "Invalid chart format, or given Content-Encoding is unsupported",
        content: {
          "application/json": {
            schema: resolver(
              v.union([
                await validationErrorSchema("invalidChart"),
                await errorLiteral(
                  "invalidChart",
                  "unsupportedContentEncoding",
                  "invalidContentEncoding"
                ),
              ])
            ),
          },
        },
        headers: {
          "Accept-Encoding": {
            description: `Supported encoding type (${supportedEncodings.join(", ")})`,
            schema: { type: "string" },
          },
        },
      },
      422: {
        description: "level index out of range",
        content: {
          "application/json": {
            schema: resolver(await errorLiteral("levelNotFound")),
          },
        },
      },
    },
  }),
  validator(
    "query",
    v.object({
      lvIndex: v.pipe(
        v.string(),
        v.regex(/^[0-9]+$/),
        v.transform(Number),
        v.description("Index of the level in the chart")
      ),
    }),
    sValidatorHook()
  ),
  async (c) => {
    const { lvIndex } = c.req.valid("query");
    const rawBody = await c.req.arrayBuffer();

    let chartData: Chart17;
    try {
      const decodedData = msgpack.decode(new Uint8Array(rawBody));
      if (
        typeof decodedData === "object" &&
        decodedData !== null &&
        "ver" in decodedData &&
        typeof decodedData.ver === "number"
      ) {
        if (decodedData.ver < currentChartVer - 1) {
          return c.json({ message: "oldChartVersion" }, 409);
        }
      }
      chartData = v.parse(ChartSchema17(), decodedData);
    } catch (e) {
      throw new HTTPException(415, { message: "invalidChart", cause: e });
    }

    if (
      !chartData.levelsFreeze.at(lvIndex) ||
      !chartData.levelsMeta.at(lvIndex)
    ) {
      throw new HTTPException(422, { message: "levelNotFound" });
    }

    // Load chart data
    const seqData: ChartSeqData = loadChart(chartData, lvIndex);

    // Return msgpack-encoded response
    const filename = "preview.fnseq.mpk";
    return c.body(new Blob([msgpack.encode(seqData)]).stream(), 200, {
      "Content-Type": "application/vnd.msgpack",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });
  }
);

export default seqPreviewApp;
