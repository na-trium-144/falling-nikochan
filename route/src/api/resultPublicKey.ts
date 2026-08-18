import { Hono } from "hono";
import { Bindings, cacheControl } from "../env.js";
import { ResultPublicKeyResponseSchema } from "@falling-nikochan/chart";
import { env } from "hono/adapter";
import { describeRoute, resolver } from "hono-openapi";
import { cache } from "hono/cache";

const resultPublicKeyApp = async () => {
  const app = new Hono<{ Bindings: Bindings }>({ strict: false });

  app
    .use(
      cache({
        cacheName: "resultPublicKey",
        cacheControl: "max-age=86400",
      })
    )
    .get(
      "/",
      describeRoute({
        description: "Get the public key for verifying result signatures.",
        responses: {
          200: {
            description: "Successful response with ResultSecret public key",
            content: {
              "application/json": {
                schema: resolver(ResultPublicKeyResponseSchema()),
              },
            },
          },
        },
      }),
      async (c) => {
        const e = env(c);
        c.header("Cache-Control", cacheControl(e, 86400));
        return c.json({ publicKey: e.RESULT_SECRET_PUBLIC_KEY! }, 200);
      }
    );

  return app;
};

export default resultPublicKeyApp;
