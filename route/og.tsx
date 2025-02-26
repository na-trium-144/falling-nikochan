import { Hono } from "hono";
import { Bindings } from "./env.js";
import { ImageResponse } from "@vercel/og";

const ogApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/",
  (c) => {
    return c.body(
      new ImageResponse(
        (
          <div
            style={{
              fontSize: 128,
              background: "white",
              width: "100%",
              height: "100%",
              display: "flex",
              textAlign: "center",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Hello world!
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      ).body!
    );
  }
);

export default ogApp;
