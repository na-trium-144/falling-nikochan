import { rateLimit } from "@falling-nikochan/chart";
import { Context } from "hono";
import { Db } from "mongodb";
import { Bindings } from "../env.js";
import { ConnInfo } from "hono/conninfo";

interface RateLimitEntry {
  ip: string;
  lastCreate: Date; // for /api/newChartFile
  lastChartFileAccess: Date; // for /api/chartFile
}

type Route = "newChartFile" | "chartFile";

export function getIp(
  c: Context,
  getConnInfo: (c: Context) => ConnInfo | null
): string {
  const xForwardedFor = c.req.header("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",").at(-1)?.trim() ?? "";
  } else {
    return getConnInfo(c)?.remote?.address || "unknown_address";
  }
}

export async function updateIp(
  env: Bindings,
  db: Db,
  ip: string,
  route: Route
): Promise<boolean> {
  if (env.API_ENV === "development" && env.API_NO_RATELIMIT) {
    return true;
  }

  const entry = await db
    .collection<RateLimitEntry>("rateLimit")
    .findOne({ ip });
  let lastAccess: Date | undefined;
  switch (route) {
    case "newChartFile":
      lastAccess = entry?.lastCreate;
      break;
    case "chartFile":
      lastAccess = entry?.lastChartFileAccess;
      break;
    default:
      route satisfies never;
  }
  if (
    lastAccess &&
    new Date().getTime() - lastAccess.getTime() < rateLimit[route] * 1000
  ) {
    return false;
  } else {
    switch (route) {
      case "newChartFile":
        await db
          .collection<RateLimitEntry>("rateLimit")
          .updateOne(
            { ip },
            { $set: { ip, lastCreate: new Date() } },
            { upsert: true }
          );
        break;
      case "chartFile":
        await db
          .collection<RateLimitEntry>("rateLimit")
          .updateOne(
            { ip },
            { $set: { ip, lastChartFileAccess: new Date() } },
            { upsert: true }
          );
        break;
      default:
        route satisfies never;
    }
    return true;
  }
}
