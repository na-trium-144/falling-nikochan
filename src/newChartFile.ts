import msgpack from "@ygoe/msgpack";
import { Chart, chartMaxSize, validateChart } from "@/chartFormat/chart";
import { updateIpLastCreate } from "./dbRateLimit";
import { MongoClient } from "mongodb";
import { chartToEntry, getChartEntry, zipEntry } from "./chart";
import { revalidateBrief } from "./brief";
import { revalidateLatest } from "./latest";
import { rateLimitMin } from "@/chartFormat/apiConfig";

export async function handleGetNewChartFile(env: Env, headers: Headers) {
  console.log(headers.get("x-forwarded-for"));
  return new Response(null, { status: 400 });
}

// cidとfidを生成し、bodyのデータを保存して、cidを返す
export async function handlePostNewChartFile(
  env: Env,
  headers: Headers,
  chartBuf: ArrayBuffer
) {
  console.log(headers.get("x-forwarded-for"));
  const ip = String(headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()); // nullもundefinedも文字列にしちゃう

  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("nikochan");

    if (
      /*process.env.NODE_ENV !== "development" &&*/
      !(await updateIpLastCreate(db, ip))
    ) {
      return new Response(
        JSON.stringify({
          message: `Too many requests, please retry ${rateLimitMin} minutes later`,
        }),
        {
          status: 429,
          headers: [["retry-after", (rateLimitMin * 60).toString()]],
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

    let chart: Chart;
    try {
      chart = msgpack.deserialize(chartBuf);
      chart = await validateChart(chart);
    } catch (e) {
      console.log(e);
      return Response.json(
        { message: "invalid chart data" },
        {
          status: 400,
        }
      );
    }

    // update Time
    const updatedAt = new Date().getTime();

    if (chart.published) {
      revalidateLatest();
    }

    let cid: string;
    while (true) {
      cid = Math.floor(Math.random() * 900000 + 100000).toString();
      const { entry } = await getChartEntry(db, cid, null);
      if (entry) {
        // cidかぶり
        continue;
      } else {
        break;
      }
    }

    await db
      .collection("chart")
      .insertOne(await zipEntry(await chartToEntry(chart, cid, updatedAt)));
    revalidateBrief(cid);

    return Response.json({ cid: cid });
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 500 });
  } finally {
    await client.close();
  }
}
