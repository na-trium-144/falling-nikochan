import { Hono } from "hono";
import { Bindings } from "../env.js";
import { env } from "hono/adapter";
import { getCookie, setCookie } from "hono/cookie";
import { getChartEntry, getPUserHash } from "./chart.js";
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { CidSchema, HashSchema } from "@falling-nikochan/chart";
import * as v from "valibot";

/**
 * chartFile のコメントを参照
 */
const hashPasswdApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid",
  async (c) => {
    const { cid } = v.parse(v.object({ cid: CidSchema }), c.req.param());
    const p = v.parse(v.object({ cp: HashSchema }), c.req.query());
    let pUserSalt: string;
    if (env(c).API_ENV === "development") {
      // secure がつかない
      pUserSalt =
        getCookie(c, "pUserSalt") || randomBytes(16).toString("base64");
      setCookie(c, "pUserSalt", pUserSalt, {
        httpOnly: true,
        maxAge: 400 * 24 * 3600,
      });
    } else {
      pUserSalt =
        getCookie(c, "pUserSalt", "host") || randomBytes(16).toString("base64");
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
      const { entry } = await getChartEntry(db, cid, {
        cidPasswdHash: p.cp,
        pSecretSalt,
      });
      return c.text(await getPUserHash(entry.pServerHash, pUserSalt), 200, {
        "cache-control": "no-store",
      });
    } finally {
      await client.close();
    }
  },
);

export default hashPasswdApp;
