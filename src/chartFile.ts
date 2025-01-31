import msgpack from "@ygoe/msgpack";
import {
  Chart,
  chartMaxSize,
  hashLevel,
  validateChart,
} from "@/chartFormat/chart";
import { MongoClient } from "mongodb";
import { chartToEntry, getChartEntry, zipEntry } from "./chart";
import { revalidateBrief } from "./brief";
import { revalidateLatest } from "./latest";

// 他のAPIと違って編集用パスワードのチェックが入る
// クエリパラメータのpで渡す

export async function handleGetChartFile(
  env: Env,
  cid: string,
  passwdHash: string | null
) {
  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("nikochan");
    let { res, chart } = await getChartEntry(db, cid, passwdHash || "");
    if (!chart) {
      return Response.json(
        { message: res?.message },
        {
          status: res?.status || 500,
        }
      );
    }
    try {
      chart = await validateChart(chart);
    } catch {
      return Response.json(
        { message: "invalid chart data" },
        {
          status: 500,
        }
      );
    }
    return new Response(new Blob([msgpack.serialize(chart)]));
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function handlePostChartFile(
  env: Env,
  cid: string,
  passwdHash: string | null,
  chartBuf: ArrayBuffer
) {
  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("nikochan");
    const { res, entry, chart } = await getChartEntry(
      db,
      cid,
      passwdHash || ""
    );
    if (!chart || !entry) {
      return Response.json(
        { message: res?.message },
        {
          status: res?.status || 500,
        }
      );
    }

    if (chartBuf.byteLength > chartMaxSize) {
      return new Response(
        JSON.stringify({
          message:
            `Chart too large (${Math.round(chartBuf.byteLength / 1000)}kB),` +
            `Max ${Math.round(chartMaxSize / 1000)}kB`,
        }),
        { status: 413 }
      );
    }

    let newChart: Chart;
    try {
      newChart = msgpack.deserialize(chartBuf);
      newChart = await validateChart(newChart);
    } catch (e) {
      console.error(e);
      return Response.json(
        { message: "invalid chart data" },
        {
          status: 400,
        }
      );
    }

    // update Time
    const prevHashes = entry.levelBrief.map((l) => l.hash);
    const newHashes = await Promise.all(
      newChart.levels.map((level) => hashLevel(level))
    );
    let updatedAt = entry.updatedAt;
    if (!newHashes.every((h, i) => h === prevHashes[i])) {
      updatedAt = new Date().getTime();
    }
    if (chart.published || newChart.published) {
      revalidateLatest();
    }

    await db.collection("chart").updateOne(
      { cid },
      {
        $set: await zipEntry(
          await chartToEntry(newChart, cid, updatedAt, entry)
        ),
      }
    );
    revalidateBrief(cid);
    return new Response(null);
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function handleDeleteChartFile(
  env: Env,
  cid: string,
  passwdHash: string | null
) {
  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("nikochan");
    const { res, chart } = await getChartEntry(db, cid, passwdHash || "");
    if (!chart) {
      return Response.json(
        { message: res?.message },
        {
          status: res?.status || 500,
        }
      );
    }

    await db.collection("chart").updateOne(
      { cid },
      {
        $set: {
          levelsCompressed: "",
          deleted: true,
        },
      }
    );
    revalidateBrief(cid);
    if (chart.published) {
      revalidateLatest();
    }
    return new Response(null);
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 500 });
  } finally {
    await client.close();
  }
}
