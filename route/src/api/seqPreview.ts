import * as msgpack from "@msgpack/msgpack";
import { Bindings } from "../env.js";
import { Hono } from "hono";
import {
  ChartSeqData,
  loadChart,
  ChartSeqDataSchema,
  LevelPlaySchema15,
  Level15Play,
} from "@falling-nikochan/chart";
import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";
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
          schema: LevelPlaySchema15(),
        },
      },
    },
    responses: {
      200: {
        description: "chart sequence data in MessagePack format for preview.",
        content: {
          "application/vnd.msgpack": {
            schema: resolver(ChartSeqDataSchema()),
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
            schema: resolver(v.object({ message: v.string() })),
          },
        },
      },
    },
  }),
  async (c) => {
    try {
      // Get the raw body as ArrayBuffer
      const rawBody = await c.req.arrayBuffer();
      
      // Decode msgpack
      let decodedData: unknown;
      try {
        decodedData = msgpack.decode(new Uint8Array(rawBody));
      } catch (error) {
        throw new HTTPException(415, { 
          message: "Invalid msgpack format" 
        });
      }

      // Check version first
      if (typeof decodedData === "object" && decodedData !== null && "ver" in decodedData) {
        if (decodedData.ver !== 15) {
          throw new HTTPException(409, { message: "oldChartVersion" });
        }
      }

      // Validate with LevelPlaySchema15
      const parseResult = v.safeParse(LevelPlaySchema15(), decodedData);
      if (!parseResult.success) {
        throw new HTTPException(415, { 
          message: `Validation error: ${parseResult.issues.map(i => i.message).join(", ")}` 
        });
      }

      const levelData = parseResult.output as Level15Play;

      // Load chart data
      const seqData: ChartSeqData = loadChart(levelData);

      // Return msgpack-encoded response
      const filename = "preview.fnseq.mpk";
      return c.body(new Blob([msgpack.encode(seqData)]).stream(), 200, {
        "Content-Type": "application/vnd.msgpack",
        "Content-Disposition": `attachment; filename="${filename}"`,
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(500, { 
        message: "Internal server error" 
      });
    }
  }
);

export default seqPreviewApp;
