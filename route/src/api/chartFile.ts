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
  CidSchema,
  HashSchema,
} from "@falling-nikochan/chart";
import { MongoClient } from "mongodb";
import {
  ChartEntryCompressed,
  chartToEntry,
  getChartEntry,
  zipEntry,
} from "./chart.js";
import { Bindings, secretSalt } from "../env.js";
import { env } from "hono/adapter";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import * as v from "valibot";

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
    const { cid } = v.parse(v.object({ cid: CidSchema }), c.req.param());
    const p = v.parse(
      v.object({
        cp: v.optional(HashSchema),
        ph: v.optional(HashSchema),
        pbypass: v.optional(v.string()),
      }),
      c.req.query(),
    );
    const v9UserSalt =
      env(c).API_ENV === "development"
        ? getCookie(c, "pUserSalt")
        : getCookie(c, "pUserSalt", "host");
    const bypass = !!p.pbypass && env(c).API_ENV === "development";
    const pSecretSalt = secretSalt(env(c));
    const client = new MongoClient(env(c).MONGODB_URI);
    try {
      await client.connect();
      const db = client.db("nikochan");
      let { entry, chart } = await getChartEntry(db, cid, {
        bypass,
        cidPasswdHash: p.cp,
        v9PasswdHash: p.ph,
        v9UserSalt,
        pSecretSalt,
      });
      switch (c.req.method) {
        case "GET":
          return c.body(new Blob([msgpack.serialize(chart)]).stream(), 200, {
            "Content-Type": "application/vnd.msgpack",
          });
        case "DELETE":
          await db.collection<ChartEntryCompressed>("chart").updateOne(
            { cid },
            {
              $set: {
                levelsCompressed: null,
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

          await db.collection<ChartEntryCompressed>("chart").updateOne(
            { cid },
            {
              $set: await zipEntry(
                await chartToEntry(
                  newChart,
                  cid,
                  updatedAt,
                  pSecretSalt,
                  entry,
                ),
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
