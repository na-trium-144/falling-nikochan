import { MongoClient } from "mongodb";
import "dotenv/config";
import { readFileSync } from "node:fs";
import { Chart, createBrief } from "@/chartFormat/chart";
import { zipEntry } from "../chart";
import { Chart5, Level5 } from "@/chartFormat/legacy/chart5";
import { NextResponse } from "next/server";

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db("nikochan");

  const fileEntries = JSON.parse(readFileSync("./exportEntries.json", "utf-8"));
  for (const entry of fileEntries) {
    const chart = entry.chart as Chart5;
    const chartBrief = await createBrief(chart as unknown as Chart);
    await db.collection("chart").insertOne(
      await zipEntry({
        cid: entry.cid,
        deleted: false,
        playCount: entry.playCount?.count || 0,
        levelsCompressed: null,
        levelBrief: chart.levels.map((level, i) => ({
          ...chartBrief.levels[i],
          name: level.name,
          type: level.type,
          hash: level.hash,
        })),
        levels: chart.levels.map((level) => ({
          notes: level.notes,
          rest: level.rest,
          bpmChanges: level.bpmChanges,
          speedChanges: level.speedChanges,
          signature: level.signature,
          lua: level.lua,
        })),
        ver: chart.ver,
        offset: chart.offset,
        editPasswd: chart.editPasswd,
        ytId: chart.ytId,
        title: chart.title,
        composer: chart.composer,
        chartCreator: chart.chartCreator,
        updatedAt: chart.updatedAt,
      })
    );
  }
  client.close();
  return NextResponse.json({})
}
