import { Hono } from "hono";
import { Bindings } from "../env.js";
import { env } from "hono/adapter";
import { getCookie, setCookie } from "hono/cookie";
import { hashPasswd } from "./chart.js";

/**
 * chartFile のコメントを参照
 */
const hashPasswdApp = new Hono<{ Bindings: Bindings }>({ strict: false }).get(
  "/:cid",
  async (c) => {
    const cid = c.req.param("cid");
    const pw = c.req.query("pw") || "";
    let key: string;
    if (env(c).NODE_ENV === "development") {
      // secure がつかない
      key = getCookie(c, "hashKey") || Math.random().toString(36).substring(2);
      setCookie(c, "hashKey", key, {
        httpOnly: true,
        maxAge: 400 * 24 * 3600,
      });
    } else {
      key =
        getCookie(c, "hashKey", "host") ||
        Math.random().toString(36).substring(2);
      setCookie(c, "hashKey", key, {
        httpOnly: true,
        maxAge: 400 * 24 * 3600,
        path: "/",
        secure: true,
        sameSite: "Strict",
        prefix: "host",
      });
    }
    return c.text(await hashPasswd(cid, pw, key), 200, {
      "cache-control": "no-store",
    });
  }
);

export default hashPasswdApp;
