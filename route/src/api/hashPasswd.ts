import { Hono } from "hono";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { getCookie, setCookie } from "hono/cookie";
import { getChartEntryCompressed, getPUserHash } from "./chart.js";
import { randomBytes } from "node:crypto";
import { Db } from "mongodb";
import { CidSchema } from "@falling-nikochan/chart";
import * as v from "valibot";
import { HTTPException } from "hono/http-exception";
import { describeRoute, resolver, validator } from "hono-openapi";
import {
  errorLiteral,
  sValidatorHook,
  validationErrorSchema,
} from "../error.js";
import {
  getPasswdParamsFromAuthHeader,
  plainPasswdHeaderDoc,
  PlainPasswdParamSchema,
} from "./passwdAuth.js";

/**
 * chartFile のコメントを参照
 */
const hashPasswdApp = new Hono<{
  Bindings: Bindings;
  Variables: { db: () => Promise<Db> };
}>({
  strict: false,
}).get(
  "/:cid",
  describeRoute({
    description:
      "Generate a unique hash of the password to be used when accessing the chart. " +
      "The correct password for the chart is required (query p or Authorization header). " +
      "The hashed password will be different for each client and each chart (due to the pUserSalt cookie).",
    parameters: [plainPasswdHeaderDoc],
    responses: {
      200: {
        description:
          "sha256(sha256(cid + passwd + secretSalt + pRandomSalt) + pUserSalt)",
        content: {
          "text/plain": {
            schema: resolver(v.string()),
          },
        },
        headers: {
          "Set-Cookie": {
            description:
              "Sets the pUserSalt cookie if it was not present in the request.",
            schema: { type: "string" },
          },
        },
      },
      400: {
        description:
          "invalid chart id or parameter, or password not specified in the chart data",
        content: {
          "application/json": {
            schema: resolver(
              v.union([
                await validationErrorSchema(),
                await errorLiteral("badRequest", "noPasswd"),
              ])
            ),
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
  validator("param", v.object({ cid: CidSchema() }), sValidatorHook()),
  validator(
    "query",
    v.object({
      p: v.optional(PlainPasswdParamSchema()),
    }),
    sValidatorHook()
  ),
  validator(
    "cookie",
    v.object({ pUserSalt: v.optional(v.string()) }),
    sValidatorHook()
  ),
  async (c) => {
    const { cid } = c.req.valid("param");
    const { p } =
      getPasswdParamsFromAuthHeader(c.req.header("Authorization")) ??
      c.req.valid("query");
    if (p === undefined) {
      throw new HTTPException(400, { message: "badRequest" });
    }
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
    const db = await c.get("db")();
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
  }
);

export default hashPasswdApp;
