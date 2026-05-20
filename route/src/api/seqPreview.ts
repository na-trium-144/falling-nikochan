import * as msgpack from "@msgpack/msgpack";
import { Bindings } from "../env.js";
import { Hono } from "hono";
import {
  ChartSeqData,
  loadChart,
  LevelPlaySchema15,
  Level15Play,
  docRefs,
  currentChartVer,
} from "@falling-nikochan/chart";
import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { describeRoute, resolver } from "hono-openapi";
import { errorLiteral } from "../error.js";

const seqPreviewApp = new Hono<{ Bindings: Bindings }>({ strict: false }).post(
  "/",
  describeRoute({
    description:
      "Accepts MessagePack-encoded Level15Play data and returns chart sequence data in MessagePack format for preview purposes.",
    requestBody: {
      description: "MessagePack-encoded Level15Play data",
      required: true,
      content: {
        "application/vnd.msgpack": {
          schema: docRefs("LevelPlay15"),
        },
      },
    },
    responses: {
      200: {
        description: "chart sequence data in MessagePack format for preview.",
        content: {
          "application/vnd.msgpack": {
            schema: docRefs("ChartSeqData"),
          },
        },
      },
      409: {
        description: "chart version is not 15",
        content: {
          "application/json": {
            schema: resolver(await errorLiteral("oldChartVersion")),
          },
        },
      },
      415: {
        description: "Invalid chart format",
        content: {
          "application/json": {
            schema: resolver(await errorLiteral("invalidChart")),
          },
        },
      },
    },
  }),
  async (c) => {
    const rawBody = await c.req.arrayBuffer();

    let levelData: Level15Play;
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
      levelData = v.parse(LevelPlaySchema15(), decodedData);
    } catch (e) {
      console.error(e);
      throw new HTTPException(415, {
        message: "invalidChart",
        cause: v.isValiError(e) ? e.issues : undefined,
      });
    }

    // Load chart data
    const seqData: ChartSeqData = loadChart(levelData);

    // Return msgpack-encoded response
    const filename = "preview.fnseq.mpk";
    return c.body(new Blob([msgpack.encode(seqData)]).stream(), 200, {
      "Content-Type": "application/vnd.msgpack",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });
  }
);

export default seqPreviewApp;
