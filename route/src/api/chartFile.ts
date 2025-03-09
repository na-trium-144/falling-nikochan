import { Hono } from "hono";
import msgpack from "@ygoe/msgpack";
import {
  ChartEdit,
  currentChartVer,
  hashLevel,
  numEvents,
  validateChart,
  chartMaxEvent,
  fileMaxSize,
} from "@falling-nikochan/chart";
import { MongoClient } from "mongodb";
import { chartToEntry, getChartEntry, zipEntry } from "./chart.js";
import { Bindings } from "../env.js";
import { env } from "hono/adapter";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";

/**
 * v9では生のパスワードをデータベースに保存せず、APIのインタフェース(Chart9Edit)としても生パスワードは用いない
 * Chart9Editデータで送受信するchangePasswd (CidPasswdHash): hash(cid + passwd)
 * データベースに保存するpServerHash: hash(CidPasswdHash + process.env.SECRET_SALT + pRandomSalt)
 *   pRandomSaltはcidごとにランダムに1回生成し固定
 * chartFileのクエリパラメータph(localStorageに保存する): hash(pServerHash + pUserSalt)
 *   pUserSaltは /api/hashPasswd でランダムにセットされる
 *
 * また、development環境に限り /api/chartFile/cid?pbypass=1 でスキップできる
 */
const chartFileApp = new Hono<{ Bindings: Bindings }>({ strict: false }).on(
  ["GET", "POST", "DELETE"],
  "/:cid",
  async (c) => {
    const cid = c.req.param("cid");
    const cidPasswdHash = c.req.query("cp");
    const v9PasswdHash = c.req.query("ph");
    let v9UserSalt: string;
    if (env(c).API_ENV === "development") {
      v9UserSalt = getCookie(c, "pUserSalt") || "";
    } else {
      v9UserSalt = getCookie(c, "pUserSalt", "host") || "";
    }
    const bypass =
      c.req.query("pbypass") === "1" && env(c).API_ENV === "development";
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
      let { entry, chart } = await getChartEntry(db, cid, {
        bypass,
        cidPasswdHash,
        v9PasswdHash,
        v9UserSalt,
        pSecretSalt,
      });
      switch (c.req.method) {
        case "GET":
          return c.body(new Blob([msgpack.serialize(chart)]).stream(), 200, {
            "Content-Type": "application/vnd.msgpack",
          });
        case "DELETE":
          await db.collection("chart").updateOne(
            { cid },
            {
              $set: {
                levelsCompressed: "",
                deleted: true,
              },
            },
          );
          return c.body(null, 204);
        case "POST": {
          const chartBuf = await c.req.arrayBuffer();
          if (chartBuf.byteLength > fileMaxSize) {
            throw new HTTPException(413, {
              message: "tooLargeFile",
              // message: `Chart too large (file size is ${chartBuf.byteLength} / ${fileMaxSize})`,
            });
          }

          const newChartObj = msgpack.deserialize(chartBuf);
          if (
            typeof newChartObj.ver === "number" &&
            newChartObj.ver < currentChartVer
          ) {
            throw new HTTPException(409, { message: "oldChartVersion" });
          }

          let newChart: ChartEdit;
          try {
            newChart = await validateChart(newChartObj);
          } catch (e) {
            console.error(e);
            throw new HTTPException(415, { message: "invalidChart" });
          }

          if (numEvents(newChart) > chartMaxEvent) {
            throw new HTTPException(413, {
              message: "tooManyEvent",
              // message: `Chart too large (number of events is ${numEvents(
              //   newChart
              // )} / ${chartMaxEvent})`,
            });
          }

          // update Time
          const prevHashes = entry.levelBrief.map((l) => l.hash);
          const newHashes = await Promise.all(
            newChart.levels.map((level) => hashLevel(level)),
          );
          let updatedAt = entry.updatedAt;
          if (
            !newHashes.every((h, i) => h === prevHashes[i]) ||
            (!entry.published && newChart.published)
          ) {
            updatedAt = new Date().getTime();
          }

          await db.collection("chart").updateOne(
            { cid },
            {
              $set: await zipEntry(
                await chartToEntry(newChart, cid, updatedAt, pSecretSalt, entry),
              ),
            },
          );
          return c.body(null, 204);
        }
        default:
          throw new Error("invalid request method");
      }
    } finally {
      await client.close();
    }
  },
);

export default chartFileApp;
