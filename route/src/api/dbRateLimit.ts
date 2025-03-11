import { rateLimitMin } from "@falling-nikochan/chart";
import { Db } from "mongodb";

interface RateLimitEntry {
  ip: string;
  lastCreate: Date;
}

export async function updateIpLastCreate(db: Db, ip: string): Promise<boolean> {
  const entry = await db
    .collection<RateLimitEntry>("rateLimit")
    .findOne({ ip });
  if (
    entry &&
    new Date().getTime() - entry.lastCreate.getTime() < rateLimitMin * 60 * 1000
  ) {
    return false;
  } else {
    const newEntry: RateLimitEntry = { ip, lastCreate: new Date() };
    await db
      .collection<RateLimitEntry>("rateLimit")
      .updateOne({ ip }, { $set: newEntry }, { upsert: true });
    return true;
  }
}
