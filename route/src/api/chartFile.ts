import { Context, Hono } from "hono";
import * as msgpack from "@msgpack/msgpack";
import {
  currentChartVer,
  hashLevel,
  numEvents,
  chartMaxEvent,
  CidSchema,
  rateLimit,
  convertToLatest,
  validateChartWithoutConvert,
  Chart14Edit,
  Chart15,
  docRefs,
} from "@falling-nikochan/chart";
import { Db } from "mongodb";
import {
  ChartEntry,
  ChartEntryCompressed,
  chartToEntry,
  entryToChart,
  getChartEntry,
  zipEntry,
} from "./chart.js";
import { Bindings, secretSalt } from "../env.js";
import { env } from "hono/adapter";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { getYTDataEntry } from "./ytData.js";
import { describeRoute, resolver, validator } from "hono-openapi";
import {
  errorLiteral,
  sValidatorHook,
  validationErrorSchema,
} from "../error.js";
import { join, dirname } from "node:path";
import dotenv from "dotenv";
import { getIp, updateIp } from "./dbRateLimit.js";
import { ConnInfo } from "hono/conninfo";
import {
  getPasswdParamsFromAuthHeader,
  passwdHeaderDoc,
  PasswdParamSchema,
} from "./passwdAuth.js";
import { supportedEncodings } from "./decompress.js";
dotenv.config({ path: join(dirname(process.cwd()), ".env") });

/**
 * Chart9Editデータで送受信するchangePasswd, /api/chartFileのpパラメータは生のパスワード
 * データベースに保存するpServerHash = hash(cid + passwd + process.env.SECRET_SALT + pRandomSalt)
 *   pRandomSaltはcidごとにランダムに1回生成し固定
 * chartFileのクエリパラメータph,localStorageに保存するph = hash(pServerHash + pUserSalt)
 *   pUserSaltは /api/hashPasswd でランダムにセットされる
 *
 * /api/chartFile にはクエリ p=passwd または ph=hash(pServerHash + pUserSalt)、
 * もしくは Authorization ヘッダーで Nikochan-Basic/Nikochan-Hash/Nikochan-Bypass を指定してアクセスする
 * POST時のデータのchangePasswdをnullにすると以前のパスワードを次回も使用し、nullでない場合それを新しいパスワードとしてデータベースを更新
 *
 * v8以前で空文字列パスワードで保存していたデータについては、 pServerhash=pRandomSalt=null
 * v9以降では空文字列パスワードでの上書き保存は許されない
 *
 * また、development環境に限り /api/chartFile/cid?pbypass=1 でスキップできる
 */
interface ChartFileAppVars {
  cid: string;
  ip: string;
  entry: ChartEntry;
  chart: ReturnType<typeof entryToChart>;
  db: Db;
  pSecretSalt: string;
}
const chartFileApp = async (config: {
  getConnInfo: (c: Context) => ConnInfo | null;
}) =>
  new Hono<{
    Bindings: Bindings;
    Variables: ChartFileAppVars;
  }>({ strict: false })
    .on(
      ["GET", "POST", "DELETE"],
      "/:cid",
      validator("param", v.object({ cid: CidSchema() }), sValidatorHook()),
      validator("query", PasswdParamSchema(), sValidatorHook()),
      validator(
        "cookie",
        v.object({
          pUserSalt: v.optional(v.string()),
        }),
        sValidatorHook()
      ),
      async (c, next) => {
        const { cid } = c.req.valid("param");
        const { p, ph, pbypass } =
          getPasswdParamsFromAuthHeader(c.req.header("Authorization")) ??
          c.req.valid("query");
        const ip = getIp(c, config.getConnInfo);
        const v9UserSalt =
          env(c).API_ENV === "development"
            ? getCookie(c, "pUserSalt")
            : getCookie(c, "pUserSalt", "host");
        const bypass = !!pbypass && env(c).API_ENV === "development";
        const pSecretSalt = secretSalt(env(c));
        const db = c.get("db");
        if (!(await updateIp(env(c), db, ip, "chartFile"))) {
          return c.json(
            {
              message: "tooManyRequest",
              // message: `Too many requests, please retry ${rateLimitMin} minutes later`,
            },
            429,
            { "retry-after": rateLimit.chartFile.toString() }
          );
        }

        let { entry, chart } = await getChartEntry(db, cid, {
          bypass,
          rawPasswd: p,
          v9PasswdHash: ph,
          v9UserSalt,
          pSecretSalt,
        });
        // 必要なデータをコンテキストに保存
        c.set("cid", cid);
        c.set("ip", ip);
        c.set("entry", entry);
        c.set("chart", chart);
        c.set("pSecretSalt", pSecretSalt);
        await next();
      }
    )
    .get(
      "/:cid",
      describeRoute({
        description:
          "Get a raw chart file in MessagePack format. Requires a password (either p/ph query or Authorization header). " +
          "The chart data format can be either Chart4, Chart5, Chart6, Chart7, Chart8Edit, Chart9Edit, Chart11Edit, Chart13Edit or Chart14Edit, " +
          `while this documentation only describes Chart15 format. ` +
          `The chart editor can import chart data from the API.`,
        parameters: [passwdHeaderDoc],
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/vnd.msgpack": {
                schema: docRefs("Chart15"),
              },
            },
            headers: {
              "Content-Disposition": {
                description: "Filename with extension of .fn{ver}.mpk",
                schema: { type: "string" },
              },
            },
          },
          400: {
            description: "invalid chart id or parameter",
            content: {
              "application/json": {
                schema: resolver(
                  v.union([
                    await validationErrorSchema(),
                    await errorLiteral("badRequest"),
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
          429: {
            description: "Rate limited",
            content: {
              "application/json": {
                schema: resolver(await errorLiteral("tooManyRequest")),
              },
            },
            headers: {
              "Retry-After": {
                description: "Number of seconds to wait before retrying",
                schema: { type: "integer" },
              },
            },
          },
        },
      }),
      (c) => {
        const chart = c.get("chart");
        const filename = `${c.get("cid")}.fn${chart.ver}.mpk`;
        return c.body(new Blob([msgpack.encode(chart)]).stream(), 200, {
          "Content-Type": "application/vnd.msgpack",
          "Content-Disposition": `attachment; filename="${filename}"`,
        });
      }
    )
    .delete(
      "/:cid",
      describeRoute({
        description:
          "Soft delete a chart. The chart will be marked as deleted and won't appear in searches or latest/popular lists. Requires a password (either p/ph query or Authorization header).",
        parameters: [passwdHeaderDoc],
        responses: {
          204: {
            description: "No content, chart deleted successfully",
          },
          400: {
            description: "invalid chart id or parameter",
            content: {
              "application/json": {
                schema: resolver(
                  v.union([
                    await validationErrorSchema(),
                    await errorLiteral("badRequest"),
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
          429: {
            description: "Rate limited",
            content: {
              "application/json": {
                schema: resolver(await errorLiteral("tooManyRequest")),
              },
            },
            headers: {
              "Retry-After": {
                description: "Number of seconds to wait before retrying",
                schema: { type: "integer" },
              },
            },
          },
        },
      }),
      async (c) => {
        const cid = c.get("cid");
        const db = c.get("db");
        await db.collection<ChartEntryCompressed>("chart").updateOne(
          { cid },
          {
            $set: {
              // levelsCompressed: null,
              deleted: true,
            },
          }
        );
        return c.body(null, 204);
      }
    )
    .post(
      "/:cid",
      describeRoute({
        description:
          "Update a chart file with new data in MessagePack format. " +
          `The chart data format must be the latest format (Chart15) or one version earlier (Chart14Edit). ` +
          `The chart data may be compressed using ${supportedEncodings.join(", ")} (in that case Content-Encoding header must be set.) ` +
          "The previous password is required (either p/ph query or Authorization header). If the posted chart data has a different password, it will be used next time.",
        requestBody: {
          description: "Chart data in MessagePack format.",
          required: true,
          content: {
            "application/vnd.msgpack": {
              schema: docRefs("Chart15"),
            },
          },
        },
        parameters: [
          passwdHeaderDoc,
          {
            name: "Content-Encoding",
            in: "header",
            description: "Encoding applied to the request body",
            schema: { type: "string" },
          },
        ],
        responses: {
          204: {
            description: "No content, chart updated successfully",
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
          409: {
            description: `chart version is older than ${currentChartVer - 1}`,
            content: {
              "application/json": {
                schema: resolver(await errorLiteral("oldChartVersion")),
              },
            },
          },
          413: {
            description: "Chart file too large",
            content: {
              "application/json": {
                schema: resolver(
                  await errorLiteral("tooLargeFile", "tooManyEvent")
                ),
              },
            },
          },
          415: {
            description:
              "Invalid chart format, or given Content-Encoding is unsupported",
            content: {
              "application/json": {
                schema: resolver(
                  v.union([
                    await validationErrorSchema("invalidChart"),
                    await errorLiteral(
                      "invalidChart",
                      "unsupportedContentEncoding",
                      "invalidContentEncoding"
                    ),
                  ])
                ),
              },
            },
            headers: {
              "Accept-Encoding": {
                description: `Supported encoding type (${supportedEncodings.join(", ")})`,
                schema: { type: "string" },
              },
            },
          },
          429: {
            description: "Rate limited",
            content: {
              "application/json": {
                schema: resolver(await errorLiteral("tooManyRequest")),
              },
            },
            headers: {
              "Retry-After": {
                description: "Number of seconds to wait before retrying",
                schema: { type: "integer" },
              },
            },
          },
        },
      }),
      async (c) => {
        const cid = c.get("cid");
        const ip = c.get("ip");
        const entry = c.get("entry");
        const db = c.get("db");
        const pSecretSalt = c.get("pSecretSalt");

        const chartBuf = await c.req.arrayBuffer();

        let newChart: Chart14Edit | Chart15;
        try {
          newChart = msgpack.decode(chartBuf) as Chart14Edit | Chart15;
          if (newChart.ver < currentChartVer - 1) {
            // 過去2バージョンまでサポート
            return c.json({ message: "oldChartVersion" }, 409);
          }
          newChart = validateChartWithoutConvert(newChart) as
            | Chart14Edit
            | Chart15;
        } catch (e) {
          throw new HTTPException(415, { message: "invalidChart", cause: e });
        }

        if (numEvents(newChart as Chart14Edit | Chart15) > chartMaxEvent) {
          throw new HTTPException(413, {
            message: "tooManyEvent",
            // message: `Chart too large (number of events is ${numEvents(
            //   newChart
            // )} / ${chartMaxEvent})`,
          });
        }

        // update Time
        // Convert existing chart to latest version before comparing hashes
        // This allows preserving play records when overwriting with same content from older versions
        const upgradedChart = await convertToLatest(c.get("chart"));
        interface LevelHash {
          hash: string;
          unlisted: boolean;
        }
        const prevHashes: LevelHash[] = await Promise.all(
          upgradedChart.levelsMeta.map(async (min, i) => ({
            unlisted: min.unlisted,
            hash: await hashLevel(upgradedChart.levelsFreeze[i]),
          }))
        );
        const savedHashesMap: Record<string, string> = {};
        for (let i = 0; i < prevHashes.length; i++) {
          savedHashesMap[prevHashes[i].hash] = entry.levelBrief[i].hash;
        }
        const newHashes: LevelHash[] =
          newChart.ver === 14
            ? await Promise.all(
                newChart.levelsMin.map(async (level, i) => ({
                  unlisted: level.unlisted,
                  hash: await hashLevel(newChart.levelsFreeze[i]),
                }))
              )
            : await Promise.all(
                newChart.levelsMeta.map(async (min, i) => ({
                  unlisted: min.unlisted,
                  hash: await hashLevel(newChart.levelsFreeze[i]),
                }))
              );
        const prevHashesFiltered = prevHashes.filter((l) => !l.unlisted);
        const newHashesFiltered = newHashes.filter((l) => !l.unlisted);
        let updatedAt = entry.updatedAt;
        // unlistedでない譜面のハッシュまたはunlistedフラグそのものが1つでも変わっている場合更新日時を更新
        if (
          prevHashesFiltered.length !== newHashesFiltered.length ||
          !newHashesFiltered.every(
            (l, i) => l.hash === prevHashesFiltered[i].hash
          ) ||
          (!entry.published && newChart.published)
        ) {
          updatedAt = new Date().getTime();
        }
        // 既存のハッシュに一致するものがあるならそれを再利用し、なければ新しいハッシュで保存
        const newSaveHashes = newHashes.map(
          (l) => savedHashesMap[l.hash] ?? l.hash
        );

        await db.collection<ChartEntryCompressed>("chart").updateOne(
          { cid },
          {
            $set: await zipEntry(
              await chartToEntry(
                newChart,
                cid,
                updatedAt,
                ip,
                await getYTDataEntry(env(c), db, newChart.ytId).catch(
                  () => undefined
                ),
                pSecretSalt,
                entry,
                newSaveHashes
              )
            ),
          }
        );
        return c.body(null, 204);
      }
    );

export default chartFileApp;
