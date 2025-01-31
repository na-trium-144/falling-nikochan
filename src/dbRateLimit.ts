import { rateLimitMin } from "@/chartFormat/apiConfig";
import { Db } from "mongodb";

interface IpEntry {
  ip: string;
  lastCreate: Date;
}

export async function updateIpLastCreate(db: Db, ip: string): Promise<boolean> {
  const entry = (await db
    .collection("rateLimit")
    .findOne({ ip })) as IpEntry | null;
  if (
    entry &&
    new Date().getTime() - entry.lastCreate.getTime() < rateLimitMin * 60 * 1000
  ) {
    return false;
  } else {
    const newEntry: IpEntry = { ip, lastCreate: new Date() };
    await db
      .collection("rateLimit")
      .updateOne({ ip }, { $set: newEntry }, { upsert: true });
    return true;
  }
}
