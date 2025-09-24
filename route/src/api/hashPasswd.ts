import { Hono } from "hono";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { getCookie, setCookie } from "hono/cookie";
import { getChartEntryCompressed, getPUserHash } from "./chart.js";
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { CidSchema } from "@falling-nikochan/chart";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import { describeRoute, resolver } from "hono-openapi";
import { errorLiteral } from "../error.js";

/**
 * chartFile のコメントを参照
 */
const hashPasswdApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid",
  describeRoute({
    description:
      "Generate a unique hash of the password to be used when accessing the chart. " +
      "The correct password for the chart is required. " +
      "The hashed password will be different for each client and each chart (due to the pUserSalt cookie).",
    parameters: [
      {
        name: "cid",
        in: "path",
        required: true,
        schema: CidSchema(),
        description: "The chart ID",
      },
      {
        name: "p",
        in: "query",
        required: true,
        schema: v.pipe(v.string(), v.minLength(1)),
        description: "The password in plain text",
      },
      {
        name: "pUserSalt",
        in: "cookie",
        required: false,
        schema: v.string(),
        description:
          "The salt stored in a cookie. If not present, a new one will be generated and set in the response cookie.",
      },
    ],
    responses: {
      200: {
        description: "sha256 hash of (cid + passwd + hashKey)",
        content: {
          "text/plain": {
            schema: v.string(),
          },
        },
        headers: {
          "Set-Cookie": {
            description:
              "Sets the pUserSalt cookie if it was not present in the request.",
            schema: v.string(),
          },
        },
      },
      400: {
        description: "invalid chart id or password not specified",
        content: {
          "application/json": {
            schema: resolver(v.object({ message: v.string() })),
          },
        },
      },
      401: {
        description: "wrong password",
        content: {
          "application/json": {
            schema: resolver(await errorLiteral("badPassword")),
          },
        },
      },
      404: {
        description: "chart id not found",
        content: {
          "application/json": {
            schema: resolver(await errorLiteral("chartIdNotFound")),
          },
        },
      },
    },
  }),
  async (c) => {
    const { cid } = v.parse(v.object({ cid: CidSchema() }), c.req.param());
    const { p } = v.parse(
      v.object({ p: v.pipe(v.string(), v.minLength(1)) }),
      c.req.query()
    );
    let pUserSalt: string;
    const newUserSalt = () =>
      randomBytes(16)
        .toString("base64")
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");
    if (env(c).API_ENV === "development") {
      // secure がつかない
      pUserSalt = getCookie(c, "pUserSalt") || newUserSalt();
      setCookie(c, "pUserSalt", pUserSalt, {
        httpOnly: true,
        maxAge: 400 * 24 * 3600,
      });
    } else {
      pUserSalt = getCookie(c, "pUserSalt", "host") || newUserSalt();
      setCookie(c, "pUserSalt", pUserSalt, {
        httpOnly: true,
        maxAge: 400 * 24 * 3600,
        path: "/",
        secure: true,
        sameSite: "Strict",
        prefix: "host",
      });
    }
    let pSecretSalt: string;
    if (env(c).SECRET_SALT) {
      pSecretSalt = env(c).SECRET_SALT!;
    } else if (env(c).API_ENV === "development") {
      pSecretSalt = "SecretSalt";
    } else {
      throw new Error("SECRET_SALT not set in production environment!");
    }
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      const entry = await getChartEntryCompressed(db, cid, {
        rawPasswd: p,
        pSecretSalt,
      });
      if (entry.pServerHash) {
        return c.text(await getPUserHash(entry.pServerHash, pUserSalt), 200, {
          "cache-control": cacheControl(env(c), null),
        });
      } else {
        throw new HTTPException(400, { message: "noPasswd" });
      }
    } finally {
      await client.close();
    }
  }
);

export default hashPasswdApp;
